// Node.js-only startup checks, loaded by instrumentation.ts on the Node runtime.
// Kept apart so the Edge compilation of instrumentation.ts never sees process.exit.

// Skip during `next build`, where runtime secrets are not available.
if (process.env.NEXT_PHASE !== 'phase-production-build') {
    const missing = ['WS_BROADCAST_SECRET', 'STORAGE_SECRET'].filter(name => !process.env[name]);
    if (missing.length) {
        console.error(`[web] Missing required environment variables: ${missing.join(', ')}. Aborting startup.`);
        process.exit(1);
    }
}

export {};
