// Removes the owner account's two-factor authentication, for a lost authenticator and backup codes.
// Usage (from the repository root): npm run reset:owner-2fa
// On a built server:                node apps/api/dist/scripts/reset-owner-2fa.js
// Without a terminal (no prompt):   add --yes
import {createInterface} from 'node:readline/promises';
import '../env.js';
import {prisma} from '../prisma.js';
import {findOwner, resetTwoFactor} from '../lib/resetOwnerTwoFactor.js';

async function confirm(email: string): Promise<boolean> {
    if (process.argv.includes('--yes')) return true;
    if (!process.stdin.isTTY) {
        console.error('No terminal to confirm in: run again with --yes.');
        return false;
    }
    const prompt = createInterface({input: process.stdin, output: process.stdout});
    const answer = await prompt.question(`Type the owner's e-mail address (${email}) to confirm: `);
    prompt.close();
    return answer.trim().toLowerCase() === email.toLowerCase();
}

async function main(): Promise<number> {
    const owner = await findOwner(prisma);
    if (!owner) {
        console.error('No owner account found. Create it with: npm run setup:admin');
        return 1;
    }
    console.log(`Owner: ${owner.email} (2FA ${owner.twoFactorEnabled ? 'enabled' : 'not enabled'})`);
    console.log('This removes the second factor and backup codes, and signs the owner out everywhere.');
    if (!await confirm(owner.email)) {
        console.error('Nothing was changed.');
        return 1;
    }
    await resetTwoFactor(prisma, owner.id);
    console.log('Done. Sign in with the password and enable 2FA again in the account settings:');
    console.log('until then, the owner has no privileged access.');
    return 0;
}

try {
    process.exitCode = await main();
} finally {
    await prisma.$disconnect();
}
