import {prisma} from '../prisma.js';

export async function getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user || !user.role) return [];

    // Supports multiple roles separated by comma
    const roleNames = user.role.split(',').map(r => r.trim());

    const roles = await prisma.role.findMany({
        where: {
            name: {in: roleNames}
        }
    });

    const permissions = new Set<string>();
    for (const role of roles) {
        if (role.permissions) {
            try {
                const perms = JSON.parse(role.permissions) as string[];
                perms.forEach(p => permissions.add(p));
            } catch (e) {
                console.error(`Failed to parse permissions for role ${role.name}`, e);
            }
        }
    }

    return Array.from(permissions);
}

export function hasPermission(userPermissions: string[], permission: string): boolean {
    if (userPermissions.includes('admin.sudo')) return true;
    return userPermissions.includes(permission);
}
