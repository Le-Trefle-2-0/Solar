import {config as loadEnv} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {apiBaseUrl, loadConfig, type Credentials} from './config.js';
import {lookUpCredentials, sameCredentials} from './credentials.js';
import {startBot} from './bot.js';

/**
 * Starts the Discord bot once it is set up in Solar (Administration > Paramètres > Bot Discord),
 * and restarts it when its token, server or API key change there. Until then it waits, instead
 * of stopping `npm run dev:all` (which ends every service as soon as one exits).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({path: path.resolve(here, '../../../.env')});

const CHECK_MS = 30_000;
/** A start that failed with the same credentials (Discord refused them, network) is retried after this. */
const RETRY_MS = 5 * 60_000;

let running: {credentials: Credentials; stop: () => Promise<void>} | null = null;
let failed: {credentials: Credentials; at: number} | null = null;
let lastState = '';

/** Logs a state once, not every 30 seconds. */
function report(state: string, message: string) {
    if (state === lastState) return;
    lastState = state;
    console.log(`[bot] ${message}`);
}

async function stopRunning() {
    if (!running) return;
    const {stop} = running;
    running = null;
    await stop().catch(e => console.warn(`[bot] stop failed: ${(e as Error).message}`));
}

async function check() {
    const lookup = await lookUpCredentials(apiBaseUrl());
    if (lookup.status === 'unreachable') {
        // Keep running with what we have; Solar may be restarting
        report('unreachable', `Solar API unreachable (${lookup.reason}), checking again in 30 seconds`);
        return;
    }
    if (lookup.status === 'not_configured') {
        if (running) console.log('[bot] no longer set up in Solar: stopping');
        await stopRunning();
        report(`missing:${lookup.missing.join()}`, `waiting for the set-up in Solar, Paramètres > Bot Discord (missing: ${lookup.missing.join(', ')})`);
        return;
    }

    const {credentials, source} = lookup;
    if (running && sameCredentials(running.credentials, credentials)) return;
    if (failed && sameCredentials(failed.credentials, credentials) && Date.now() - failed.at < RETRY_MS) return;

    if (running) console.log('[bot] set-up changed in Solar: restarting');
    await stopRunning();
    try {
        const stop = await startBot(loadConfig(credentials));
        running = {credentials, stop};
        failed = null;
        report('running', source === 'env' ? 'started with the .env credentials' : 'started with the set-up from Solar');
    } catch (e) {
        failed = {credentials, at: Date.now()};
        lastState = '';
        console.error(`[bot] could not start: ${(e as Error).message}`);
    }
}

let checking = false;

async function loop() {
    if (checking) return;
    checking = true;
    try {
        await check();
    } finally {
        checking = false;
    }
}

const timer = setInterval(() => void loop(), CHECK_MS);
void loop();

async function shutdown() {
    console.log('[bot] stopping');
    clearInterval(timer);
    await stopRunning();
    process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
process.on('unhandledRejection', (e) => console.error(`[bot] unhandled error: ${(e as Error)?.message ?? e}`));
