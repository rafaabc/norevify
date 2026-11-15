import { readFile } from 'node:fs/promises';
import path from 'node:path';

const LANGS = ['en', 'pt-BR'];

// Reads both language versions of a legal doc at build/render time (server only).
export async function loadLegalDoc(doc) {
  const entries = await Promise.all(
    LANGS.map(async (lang) => [
      lang,
      await readFile(path.join(process.cwd(), 'i18n', 'legal', lang, `${doc}.md`), 'utf8'),
    ]),
  );
  return Object.fromEntries(entries);
}
