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

export async function sendNewsletter(newsletterId: string) {
    const newsletter = await prisma.newsletter.findUnique({
        where: {id: newsletterId},
        include: {author: {select: {name: true, displayUsername: true}}}
    });

    if (!newsletter) throw new Error('not_found');

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

        // Send individually to personalize unsubscribe link
        const results = await Promise.allSettled(recipients.map(async (recipient) => {
            const footerText = isPublic
                ? `<p>Cet e-mail a été envoyé par <strong>${authorName}</strong>.</p>
                   <p>Vous recevez cet e-mail car vous vous êtes inscrit à notre newsletter via letrefle.org.</p>`
                : `<p>Cet e-mail a été envoyé par <strong>${authorName}</strong> via la plateforme Solar.</p>
                   <p>Vous recevez cet e-mail car vous êtes inscrit à notre newsletter. Vous pouvez gérer vos préférences d'abonnement dans les <a href="${APP_URL}/app/settings" style="color: #8cc088; text-decoration: none;">paramètres de votre compte</a> sur l'application.</p>`;

            const {html} = renderEmailTemplate({
                title: newsletter.title,
                content: contentHtml,
                footer: footerText,
                showSolarLink: !isPublic,
                unsubscribeUrl: `${APP_URL}/newsletters/unsubscribe?id=${encodeURIComponent(recipient.id)}&sig=${unsubscribeSignature(recipient.id)}`
            });

            return resend.emails.send({
                from: "Le Trèfle 2.0 <newsletter@solar.letrefle.org>",
                to: recipient.email,
                subject: newsletter.title,
                html,
            });
        }));

        const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
        if (errors.length === recipients.length) {
            console.error('[newsletters] All emails failed:', errors);
            throw new Error('failed_to_send_all_emails');
        }

        await prisma.newsletter.update({
            where: {id: newsletterId},
            data: {status: 'sent', sentAt: new Date()}
        });

        return {success: true, count: recipients.length - errors.length};
    } catch (e: any) {
        console.error('[newsletters] Send error:', e);
        throw e;
    }
}
