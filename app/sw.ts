/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  // /api/ responses are never cached: NetworkFirst previously kept 200s here for
  // 24h under a URL-only key, so after logout (which only clears the localStorage
  // token) the next user on a shared device could read the prior user's expenses,
  // income, account export, or admin user list straight out of CacheStorage, with
  // no token, either via DevTools or the NetworkFirst offline/slow-network
  // fallback. See CLAUDE.md (PWA) — do not reintroduce an /api/ matcher here.
  runtimeCaching: [...defaultCache],
});

serwist.addEventListeners();
