/**
 * Extra user columns exposed through Better Auth.
 *
 * `input: false` means /api/auth/update-user and sign-up ignore the field: only
 * server actions (through Prisma) may write it. Document status, dates and files
 * must never be set by the user themself (#246).
 */
const serverOnly = {required: false, input: false} as const;

export const userAdditionalFields = {
    documentsStatus: {type: "string", ...serverOnly, defaultValue: "missing"},
    documentsSentAt: {type: "date", ...serverOnly},
    documentsValidatedAt: {type: "date", ...serverOnly},
    documentsRenewalAt: {type: "date", ...serverOnly},
    documentsText: {type: "string", ...serverOnly},
    firstName: {type: "string", required: false},
    lastName: {type: "string", required: false},
    birthDate: {type: "date", required: false},
    addressStreet: {type: "string", required: false},
    addressNumber: {type: "string", required: false},
    addressPostalCode: {type: "string", required: false},
    addressCity: {type: "string", required: false},
    idCardFileId: {type: "string", ...serverOnly},
    idCardStatus: {type: "string", ...serverOnly, defaultValue: "missing"},
    idCardRejectReason: {type: "string", ...serverOnly},
    casierFileId: {type: "string", ...serverOnly},
    casierStatus: {type: "string", ...serverOnly, defaultValue: "missing"},
    casierRejectReason: {type: "string", ...serverOnly},
    newsletterSubscription: {type: "boolean", required: false, defaultValue: false},
} as const;

/** Fields that must stay out of reach of /api/auth/update-user. */
export const SERVER_ONLY_USER_FIELDS = [
    "documentsStatus", "documentsSentAt", "documentsValidatedAt", "documentsRenewalAt", "documentsText",
    "idCardFileId", "idCardStatus", "idCardRejectReason",
    "casierFileId", "casierStatus", "casierRejectReason",
] as const;
