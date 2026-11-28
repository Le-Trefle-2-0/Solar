import {Resend} from 'resend';
import {prisma} from '../prisma.js';
import {renderEmailTemplate} from './email-template.js';
import {APP_URL} from '../env.js';
import {unsubscribeSignature} from './unsubscribeToken.js';
import {internalRecipients} from './newsletterRecipients.js';
import {getOwnerId} from './permissions.js';
import {STANDING_SELECT} from './accountStanding.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to decode Bytes fields from Prisma
export const decodeBytes = (bytes: any): string => {
    if (!bytes) return '';
    if (Buffer.isBuffer(bytes)) {
        return bytes.toString('utf8');
    }
    if (Array.isArray(bytes)) {
        return Buffer.from(bytes).toString('utf8');
    }
    if (typeof bytes === 'object' && bytes.type === 'Buffer' && Array.isArray(bytes.data)) {
        return Buffer.from(bytes.data).toString('utf8');
    }
    // Handle Uint8Array or other buffer-like objects that might come from Prisma
    if (bytes instanceof Uint8Array || (bytes.constructor && bytes.constructor.name === 'Uint8Array')) {
        return Buffer.from(bytes).toString('utf8');
    }
    return String(bytes);
};

/** Resend takes at most 100 e-mails per batch call, and about two calls a second. */
const BATCH_SIZE = 100;
const BATCH_PAUSE_MS = 600;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendNewsletter(newsletterId: string) {
    const newsletter = await prisma.newsletter.findUnique({
        where: {id: newsletterId},
        include: {author: {select: {name: true, displayUsername: true}}}
    });

    if (!newsletter) throw new Error('not_found');

    // Claimed before anything is sent: a second click, or the scheduler's next tick while this
    // send still runs, finds it taken and sends nothing (status "sending", then "sent")
    const previousStatus = newsletter.status;
    const claimed = await prisma.newsletter.updateMany({
        where: {id: newsletterId, status: {in: ['draft', 'scheduled']}},
        data: {status: 'sending'},
    });
    if (!claimed.count) throw new Error('already_sent');

    // Use the stored HTML content if available, otherwise fallback to a basic wrap of the raw text
    const contentHtml = newsletter.htmlContent
        ? decodeBytes(newsletter.htmlContent)
        : `<div>${decodeBytes(newsletter.content)}</div>`;

    const isPublic = newsletter.target === 'public';
    const authorName = (isPublic)
        ? "L'équipe Le Trèfle 2.0"
        : (newsletter.author.displayUsername || newsletter.author.name || "L'équipe Solar");

    try {
        let recipients: {email: string, id: string}[] = [];

        if (isPublic) {
            const subscribers = await prisma.newsletterSubscriber.findMany({
                select: {email: true, id: true}
            });
            recipients = subscribers;
        } else {
            // Internal news: active team accounts only, never banned, closed, blocked or
            // role-less ones, nor the bot (#263)
            const [subscribers, roleRows, ownerId] = await Promise.all([
                prisma.user.findMany({
                    where: {newsletterSubscription: true},
                    select: {email: true, id: true, role: true, ...STANDING_SELECT},
                }),
                prisma.role.findMany({select: {name: true, permissions: true}}),
                getOwnerId(),
            ]);
            recipients = internalRecipients(subscribers, ownerId, roleRows);
        }

        if (recipients.length === 0) {
            throw new Error('no_subscribers');
        }

        const footerText = isPublic
            ? `<p>Cet e-mail a été envoyé par <strong>${authorName}</strong>.</p>
               <p>Vous recevez cet e-mail car vous vous êtes inscrit à notre newsletter via letrefle.org.</p>`
            : `<p>Cet e-mail a été envoyé par <strong>${authorName}</strong> via la plateforme Solar.</p>
               <p>Vous recevez cet e-mail car vous êtes inscrit à notre newsletter. Vous pouvez gérer vos préférences d'abonnement dans les <a href="${APP_URL}/app/settings" style="color: #8cc088; text-decoration: none;">paramètres de votre compte</a> sur l'application.</p>`;

        // One e-mail per person, for the personal unsubscribe link
        const emails = recipients.map(recipient => ({
            from: "Le Trèfle 2.0 <newsletter@solar.letrefle.org>",
            to: recipient.email,
            subject: newsletter.title,
            html: renderEmailTemplate({
                title: newsletter.title,
                content: contentHtml,
                footer: footerText,
                showSolarLink: !isPublic,
                unsubscribeUrl: `${APP_URL}/newsletters/unsubscribe?id=${encodeURIComponent(recipient.id)}&sig=${unsubscribeSignature(recipient.id)}`
            }).html,
        }));

        // In batches, one after the other: sent all at once, most were refused by Resend's rate limit
        let sent = 0;
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            if (i) await pause(BATCH_PAUSE_MS);
            const batch = emails.slice(i, i + BATCH_SIZE);
            try {
                const {error} = await resend.batch.send(batch);
                if (error) console.error('[newsletters] Batch failed:', error.message);
                else sent += batch.length;
            } catch (e: any) {
                console.error('[newsletters] Batch failed:', e?.message ?? e);
            }
        }
        if (!sent) throw new Error('failed_to_send_all_emails');

        await prisma.newsletter.update({
            where: {id: newsletterId},
            data: {status: 'sent', sentAt: new Date()}
        });

        return {success: true, count: sent};
    } catch (e: any) {
        // Nothing went out: it can be sent again
        await prisma.newsletter.update({where: {id: newsletterId}, data: {status: previousStatus}}).catch(() => {});
        console.error('[newsletters] Send error:', e);
        throw e;
    }
}
