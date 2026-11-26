// Runs once when the Next.js server starts.
export function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    // Skip during `next build`, where runtime secrets are not available.
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    const missing = ['WS_BROADCAST_SECRET', 'STORAGE_SECRET'].filter(name => !process.env[name]);
    if (missing.length) {
        console.error(`[web] Missing required environment variables: ${missing.join(', ')}. Aborting startup.`);
        process.exit(1);
    }
}
