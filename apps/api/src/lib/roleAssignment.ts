export interface RoleAssignment {
    /** Comma-separated roles of the user doing the assignment. */
    callerRole: string | null;
    /** Comma-separated roles the target currently holds. */
    targetRole: string | null;
    requested: unknown[];
    /** Every role defined in the database. */
    knownRoles: {name: string; weight: number}[];
    isSelf: boolean;
}

const split = (roles: string | null) => (roles || '').split(',').map(r => r.trim());

/** Returns why the assignment must be refused, or null if it is allowed. */
export function checkRoleAssignment({callerRole, targetRole, requested, knownRoles, isSelf}: RoleAssignment)
    : {status: 400 | 403; message: string} | null {
    const weights = new Map(knownRoles.map(r => [r.name, r.weight]));

    // An empty role is read by Better Auth as its default role.
    if (requested.length === 0) return {status: 400, message: 'Invalid roles'};
    // Roles are stored comma-joined, so only exact existing names may be written:
    // "x,admin" or "admin " would otherwise be read back as "admin".
    if (!requested.every((r): r is string => typeof r === 'string' && !r.includes(',') && r === r.trim() && weights.has(r))) {
        return {status: 400, message: 'Invalid roles'};
    }

    const callerRoles = split(callerRole);
    if (callerRoles.includes('admin')) return null;

    const highest = (roles: string[]) => Math.max(-Infinity, ...roles.flatMap(r => weights.get(r) ?? []));
    const callerWeight = highest(callerRoles);

    // 'admin' is refused by name too, in case its weight has been lowered.
    if (requested.some(r => r === 'admin' || weights.get(r)! >= callerWeight)) {
        return {status: 403, message: 'forbidden: cannot assign roles of equal or higher weight'};
    }
    // Without this, a manager could strip an admin of their roles.
    if (!isSelf && (split(targetRole).includes('admin') || highest(split(targetRole)) >= callerWeight)) {
        return {status: 403, message: 'forbidden: cannot manage users of equal or higher weight'};
    }
    return null;
}

/** Role names that would be stored or read back as something else. */
export function isValidRoleName(name: unknown): name is string {
    return typeof name === 'string' && name.length > 0 && name.length <= 64
        && name === name.trim() && !name.includes(',');
}

/** Returns why a non-admin may not create or update a role, or null if allowed. */
export function checkRoleChange(
    callerWeight: number,
    /** The role as currently stored, if the request targets an existing one. */
    existing: {name: string; weight: number} | null,
    requested: {name: unknown; weight: unknown},
): string | null {
    const tooHigh = 'forbidden: cannot manage roles of equal or higher weight';
    if (existing && (existing.name === 'admin' || existing.weight >= callerWeight)) return tooHigh;
    // A missing or non-numeric weight would pass a plain ">=" comparison.
    if (requested.name === 'admin' || requested.name === 'none' || typeof requested.weight !== 'number' || !(requested.weight < callerWeight)) {
        return tooHigh;
    }
    return null;
}
