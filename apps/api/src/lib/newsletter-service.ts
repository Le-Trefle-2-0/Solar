import {Resend} from 'resend';
import {prisma} from '../prisma.js';
import {renderEmailTemplate} from './email-template.js';
import {APP_URL} from '../env.js';

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

    const subscribers = await prisma.user.findMany({
        where: {newsletterSubscription: true},
        select: {email: true}
    });

    if (subscribers.length === 0) {
        throw new Error('no_subscribers');
    }

    // Use the stored HTML content if available, otherwise fallback to a basic wrap of the raw text
    const contentHtml = newsletter.htmlContent
        ? decodeBytes(newsletter.htmlContent)
        : `<div>${decodeBytes(newsletter.content)}</div>`;

    const authorName = newsletter.author.displayUsername || newsletter.author.name || "L'équipe Solar";
    const {html} = renderEmailTemplate({
        title: newsletter.title,
        content: contentHtml,
        footer: `
            <p>Cet e-mail a été envoyé par <strong>${authorName}</strong> via la plateforme Solar.</p>
            <p>Vous recevez cet e-mail car vous êtes inscrit à notre newsletter. Vous pouvez gérer vos préférences d'abonnement dans les <a href="${APP_URL}/app/settings" style="color: #8cc088; text-decoration: none;">paramètres de votre compte</a> sur l'application.</p>
        `
    });

    const emails = subscribers.map(s => s.email);

    try {
        const {data, error} = await resend.emails.send({
            from: "Newsletter <newsletter@solar.letrefle.org>",
            to: emails,
            subject: newsletter.title,
            html,
        });

        if (error) {
            console.error('[newsletters] Resend error:', error);
            throw new Error(error.message);
        }

        await prisma.newsletter.update({
            where: {id: newsletterId},
            data: {status: 'sent', sentAt: new Date()}
        });

        return data;
    } catch (e: any) {
        console.error('[newsletters] Send error:', e);
        throw e;
    }
}
