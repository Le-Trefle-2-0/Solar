import {prisma} from '../prisma.js';
import {sendNewsletter} from './newsletter-service.js';

let interval: NodeJS.Timeout | null = null;

export function startNewsletterScheduler() {
    if (interval) return;

    console.log('[scheduler] Starting newsletter scheduler...');

    // Check every minute
    interval = setInterval(async () => {
        try {
            const now = new Date();
            const toSend = await prisma.newsletter.findMany({
                where: {
                    status: 'scheduled',
                    scheduledAt: {
                        lte: now
                    }
                }
            });

            if (toSend.length > 0) {
                console.log(`[scheduler] Found ${toSend.length} scheduled newsletters to send.`);
                for (const newsletter of toSend) {
                    try {
                        console.log(`[scheduler] Sending scheduled newsletter: ${newsletter.id} (${newsletter.title})`);
                        await sendNewsletter(newsletter.id);
                        console.log(`[scheduler] Successfully sent newsletter: ${newsletter.id}`);
                    } catch (err) {
                        console.error(`[scheduler] Failed to send scheduled newsletter ${newsletter.id}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error('[scheduler] Error in newsletter scheduler:', err);
        }
    }, 60 * 1000);
}

export function stopNewsletterScheduler() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}
