/**
 * The administrative validation ("adhésion") asked of an invited volunteer: identity details, ID card
 * and criminal record, sent at first sign-in and reviewed by an account manager. It can be left out
 * at invitation for volunteers whose adhésion is already complete elsewhere (the former platform):
 * their account starts validated. Renewals can still be requested later, as for anyone.
 */

export function membershipFields(requested: boolean, now = new Date()) {
    if (requested) return {};
    return {
        documentsStatus: "validated",
        idCardStatus: "validated",
        casierStatus: "validated",
        documentsValidatedAt: now,
    };
}
