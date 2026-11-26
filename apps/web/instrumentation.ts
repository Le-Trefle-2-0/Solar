// Runs once when the Next.js server starts.
export async function register() {
    // Node-only code lives in its own file: Next.js also compiles this one for the Edge runtime.
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./instrumentation-node');
    }
}
