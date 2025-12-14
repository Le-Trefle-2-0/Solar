import 'dotenv/config';

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_HOST = process.env.API_HOST || '0.0.0.0';
export const API_PORT = Number(process.env.API_PORT || 4000);
export const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
