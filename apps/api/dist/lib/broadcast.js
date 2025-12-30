export async function broadcast(room, event, data) {
    try {
        let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
        if (base.startsWith('ws://'))
            base = 'http://' + base.slice('ws://'.length);
        if (base.startsWith('wss://'))
            base = 'https://' + base.slice('wss://'.length);
        const secret = process.env.WS_BROADCAST_SECRET || 'fallback_broadcast_secret_for_dev_only';
        console.log(`[api] Broadcasting event "${event}" to room "${room}"`);
        const response = await fetch(`${base}/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-ws-secret': secret,
            },
            body: JSON.stringify({
                room,
                event,
                data
            }),
        });
        if (!response.ok) {
            console.warn(`[api] Broadcast failed with status ${response.status}: ${await response.text()}`);
        }
        else {
            console.log(`[api] Broadcast of "${event}" successful`);
        }
    }
    catch (err) {
        console.warn('[api] Failed to broadcast:', err);
    }
}
