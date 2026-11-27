/**
 * Recovery of the owner account when its second factor is lost: nobody can manage the owner
 * from the application, so this runs on the server (see scripts/reset-owner-2fa.ts).
 */

/** Same key as OWNER_SETTING_KEY in lib/permissions.ts. */
const OWNER_SETTING_KEY = 'owner_user_id';

type Db = {
    settings: {findUnique(args: any): Promise<{value: string | null} | null>};
    user: {findUnique(args: any): Promise<{id: string; email: string; twoFactorEnabled: boolean | null} | null>; update(args: any): any};
    twoFactor: {deleteMany(args: any): any};
    session: {deleteMany(args: any): any};
    $transaction(operations: any[]): Promise<unknown>;
};

export async function findOwner(db: Db) {
    const setting = await db.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
    if (!setting?.value) return null;
    return db.user.findUnique({where: {id: setting.value}, select: {id: true, email: true, twoFactorEnabled: true}});
}

/**
 * Removes the second factor (secret and backup codes) and signs the account out everywhere,
 * all or nothing. The password and passkeys are left as they are.
 */
export async function resetTwoFactor(db: Db, userId: string): Promise<void> {
    await db.$transaction([
        db.twoFactor.deleteMany({where: {userId}}),
        db.user.update({where: {id: userId}, data: {twoFactorEnabled: false}}),
        db.session.deleteMany({where: {userId}}),
    ]);
}
