export interface Msg {
    author: {
        id: string;
        name: string;
        image: string;
    },
    content: string;
    timestamp: number;
    channel: {
        id: string;
    }
}

export type RoleSlotInput = {
    role: string;
    goalCount: number;
};

export type EventInput = {
    title: string;
    description?: string;
    start: Date | string;
    end: Date | string;
    userId: string;
    roleSlots: RoleSlotInput[];
};