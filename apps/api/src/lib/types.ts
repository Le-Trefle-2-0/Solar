export type RoleSlotInput = {
    role: string;
    goalCount: number;
    part?: string;
};

export type EventInput = {
    title: string;
    description?: string;
    start: Date | string;
    end: Date | string;
    userId: string;
    roleSlots: RoleSlotInput[];
};
