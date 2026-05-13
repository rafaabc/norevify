import * as fs from 'fs';
import * as path from 'path';

const TRACK_FILE = path.join(process.cwd(), 'e2e', '.test-user-ids.json');

export function trackUserId(id: string): void {
  let ids: string[] = [];
  try {
    ids = JSON.parse(fs.readFileSync(TRACK_FILE, 'utf-8'));
  } catch {
    // file doesn't exist yet
  }
  ids.push(id);
  fs.writeFileSync(TRACK_FILE, JSON.stringify(ids), 'utf-8');
}

export function readAndClearIds(): string[] {
  try {
    const ids: string[] = JSON.parse(fs.readFileSync(TRACK_FILE, 'utf-8'));
    fs.unlinkSync(TRACK_FILE);
    return ids;
  } catch {
    return [];
  }
}
