import prisma from "@/lib/prisma";

/** Same resolution as getUserPermissions in the API: union of the permissions of every role. */
export async function getRolePermissions(role: string | null | undefined): Promise<string[]> {
    const names = (role || "").split(",").map(r => r.trim()).filter(Boolean);
    if (!names.length) return [];
    const roles = await prisma.role.findMany({where: {name: {in: names}}, select: {permissions: true}});
    const perms = new Set<string>();
    for (const r of roles) {
        try {
            (JSON.parse(r.permissions || "[]") as string[]).forEach(p => perms.add(p));
        } catch {
            // Malformed role permissions grant nothing
        }
    }
    return Array.from(perms);
}
