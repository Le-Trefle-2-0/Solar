import 'dotenv/config';

export const STORAGE_HOST = process.env.STORAGE_HOST || '0.0.0.0';
export const STORAGE_PORT = Number(process.env.STORAGE_PORT || 7000);
export const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || `http://localhost:${STORAGE_PORT}`;
