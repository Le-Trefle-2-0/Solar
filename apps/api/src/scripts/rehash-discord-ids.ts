// One-off: converts the unkeyed SHA-256 values of already closed tickets. Safe to run again.
// Usage (from apps/api): npx tsx src/scripts/rehash-discord-ids.ts
import '../env.js';
import {prisma} from '../prisma.js';
import {upgradeLegacyHash} from '../lib/pseudonym.js';

const tickets = await prisma.ticket.findMany({select: {id: true, discordUserID: true}});
let updated = 0;
for (const ticket of tickets) {
    const upgraded = upgradeLegacyHash(ticket.discordUserID);
    if (!upgraded) continue;
    await prisma.ticket.update({where: {id: ticket.id}, data: {discordUserID: upgraded}});
    updated++;
}
console.log(`Converted ${updated} of ${tickets.length} tickets.`);
await prisma.$disconnect();
