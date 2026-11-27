import {config} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({path: path.resolve(__dirname, '../../../.env')});

// Internal service: only the web app talks to it, so listen on loopback unless told otherwise
export const STORAGE_HOST = process.env.STORAGE_HOST || '127.0.0.1';
export const STORAGE_PORT = Number(process.env.STORAGE_PORT || 3004);
export const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || `http://localhost:${STORAGE_PORT}`;

// Fail closed: the service holds identity documents and criminal records (#211)
if (!process.env.STORAGE_SECRET) {
    console.error('[storage] Missing required environment variable: STORAGE_SECRET. Aborting startup.');
    process.exit(1);
}
export const STORAGE_SECRET = process.env.STORAGE_SECRET;
