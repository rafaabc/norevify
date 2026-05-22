# Plano: Upgrade Next.js 14 → 15 (Opção A)

## Context

Sentry está configurado mas eventos de Route Handlers App Router não chegam ao dashboard. Causa raiz: hook `onRequestError` exportado por `instrumentation.js` (padrão recomendado pelo wizard do Sentry) **só existe a partir do Next.js 15**. No Next.js 14.2.35 atual, o hook é silenciosamente ignorado — `Sentry.captureRequestError` nunca dispara, e erros 500 em rotas API não viram issues.

Validações já feitas em sessão anterior:
- DSN correto, projeto correto, `SENTRY_AUTH_TOKEN` válido, env vars presentes em Vercel.
- `instrumentation.js` é carregado (server config inicializa, `clientPresent: true`).
- Manual `Sentry.captureException()` funciona; falta apenas o hook automático de Route Handlers.

Resultado esperado: após upgrade, `throw` em `app/api/sentry-test/route.js` gera issue automaticamente via `onRequestError`.

## Pre-flight (estado atual do codebase)

Auditoria confirmou que o código já está majoritariamente compatível com v15:
- Todos os dynamic route handlers já fazem `await ctx.params` (`app/api/expenses/[id]/route.js`, `app/api/reminders/[id]/route.js`, `app/api/reminders/[id]/complete/route.js`).
- Nenhum uso de `cookies()`, `headers()`, `draftMode()` server-side.
- Nenhum page/layout usa `params`/`searchParams` server-side (tudo client com `useParams()`/`useSearchParams()`).
- Testes mockam apenas `next/navigation` (hooks síncronos, inalterados) e `next/link`.

Risco principal está em **peer-deps**:
- `@ducanh2912/next-pwa@^10.2.9` — verificar suporte a Next 15.
- `lucide-react@^1.16.0` — versão antiga; provável bump junto.

## Mudanças

### 1. `package.json`
- `next`: `^14.2.35` → `^15.0.0` (ou versão estável mais recente da linha 15.x).
- `eslint-config-next`: bump para `^15` casado.
- Verificar / bumpar conforme necessário:
  - `@ducanh2912/next-pwa` — consultar changelog; se incompatível, considerar alternativa (`next-pwa` mantido ou `serwist`).
  - `lucide-react` — bumpar para linha atual se for safe (uso restrito a ícones).

Comando:
```bash
npm install next@^15 eslint-config-next@^15
npm install lucide-react@latest
npm install @ducanh2912/next-pwa@latest  # verificar primeiro
```

### 2. `next.config.mjs`
Remover flags que mudaram em v15:

```diff
 const nextConfig = {
-  experimental: {
-    instrumentationHook: true,
-    serverComponentsExternalPackages: ['@sentry/nextjs', 'require-in-the-middle'],
-  },
+  serverExternalPackages: ['@sentry/nextjs', 'require-in-the-middle'],
   async headers() { ... },
   webpack(config) { ... },
 };
```

Notas:
- `instrumentationHook` agora é default — flag removida.
- `serverComponentsExternalPackages` renomeado para `serverExternalPackages` e promovido para top-level.
- Manter regra webpack ESM para arquivos `instrumentation*` e `sentry.*.config` (ainda necessária para o `valueInjectionLoader`).
- Manter `withSentryConfig(withPWAConfig(nextConfig), {...})` no fim.

### 3. Codemods (executar para garantir)
```bash
npx @next/codemod@canary upgrade latest
```
Roda automaticamente os codemods de v15 (async-request-api, etc.). Esperado: noop ou diffs mínimos, dado pre-flight.

### 4. Remover rota de teste após validação
Deletar `app/api/sentry-test/route.js` depois que evento aparecer no dashboard.

## Escopo adicional

### 5. Upgrade React 18 → 19

- `package.json`: `react` `^18.3.1` → `^19`, `react-dom` `^18.3.1` → `^19`.
- Bumpar tipos: `@types/react`, `@types/react-dom` para `^19`.
- Verificar `@testing-library/react@^16.0.0` — compatível com React 19 (v16+ suporta).
- Smoke test em jsdom: rodar `npm run test:unit:frontend` após bump.
- Pontos de atenção:
  - `useFormState` deprecado → `useActionState` (codebase não usa nenhum dos dois — verificar via grep antes do upgrade).
  - `forwardRef` agora opcional (ref como prop) — não quebra código existente.
  - `propTypes` e `defaultProps` em function components removidos — verificar via grep.

### 6. Turbopack como bundler default

- Atualizar scripts `package.json`:
  ```diff
  -    "dev": "next dev",
  +    "dev": "next dev --turbo",
  ```
- Build de produção continua webpack (Turbopack build ainda beta em v15). Manter `next build` sem flag.
- Verificar compat de `withSentryConfig` + `@ducanh2912/next-pwa` com Turbopack em dev:
  - Sentry: webpack-only para sourcemap upload — dev com turbo OK pois upload roda em build.
  - next-pwa: gera SW em build (webpack) — dev com turbo OK pois SW desabilitado em dev (`disable: NODE_ENV === 'development'`).
- Rule webpack ESM custom (`next.config.mjs`) só roda em webpack build; em dev turbo, instrumentation files são ESM nativos — checar se precisa renomear para `.mjs` quando rodando turbo.
- Fallback: se turbo quebrar dev, reverter script para `next dev`.

### 7. Auditoria de caching `fetch` server-side

Em Next.js 15, `fetch()` é **uncached por default** (oposto do v14). Mudança breaking silenciosa para código que dependia de cache implícito.

- Grep server-side fetch calls:
  ```bash
  grep -rn "fetch(" app/ lib/ --include="*.js" --include="*.mjs"
  ```
- Para cada chamada server-side encontrada, decidir:
  - Quer cache → adicionar `{ cache: 'force-cache' }` ou `{ next: { revalidate: N } }`.
  - Não quer cache → deixar default (sem mudança).
- Codebase atual: praticamente todas as chamadas HTTP são client-side via `services/apiService.js` (não afetado). Server-side fetch é raro. Risco baixo, mas auditar.

## Verificação

1. **Build local**: `npm run build` — sem erros.
2. **Dev server**: `npm run dev` — smoke test login/navegar.
3. **Teste Sentry**: `GET /api/sentry-test` → aguardar 30s → confirmar issue via Sentry MCP `search_events` projeto `norevify`.
4. **Test suites**: `npm run test:unit && npm run test:integration`.
5. **Deploy Vercel**: push branch + PR → build verde em preview → hit `/api/sentry-test` na preview URL → confirmar issue.
6. **Cleanup**: deletar `app/api/sentry-test/route.js`.

## Arquivos a modificar

- `package.json` — bumps: next, eslint-config-next, lucide-react, next-pwa, react, react-dom, @types/react, @types/react-dom; script dev com --turbo
- `package-lock.json` — regenerado via npm install
- `next.config.mjs` — remover `experimental.instrumentationHook`, mover `serverComponentsExternalPackages` → `serverExternalPackages`
- `app/api/sentry-test/route.js` — deletar após verificação Sentry
