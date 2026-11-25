export interface PowChallenge {
    salt: string;
    exp: number;
    difficulty: number;
    sig: string;
}

/** Solves the proof of work required to open a public chat. Needs a secure context (https or localhost). */
export async function solvePow({salt, exp, difficulty, sig}: PowChallenge) {
    const encoder = new TextEncoder();
    for (let nonce = 0; ; nonce++) {
        const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}.${nonce}`)));
        let bits = 0;
        while (bits < difficulty && !(hash[bits >> 3] & (0x80 >> (bits % 8)))) bits++;
        if (bits === difficulty) return {salt, exp, sig, nonce};
    }
}
