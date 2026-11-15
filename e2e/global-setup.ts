import * as path from 'path';
import dotenv from 'dotenv';
import { assertTestDb } from '../test/helpers/assertTestDb.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Abort before any test registers a user: e2e must never touch the production database.
export default function globalSetup(): void {
  assertTestDb();
}
