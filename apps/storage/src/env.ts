import {config} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({path: path.resolve(__dirname, '../../../.env')});

export const STORAGE_HOST = process.env.STORAGE_HOST || '0.0.0.0';
export const STORAGE_PORT = Number(process.env.STORAGE_PORT || 3004);
export const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || `http://localhost:${STORAGE_PORT}`;
