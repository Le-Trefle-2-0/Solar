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

export type EventRoleSlot = {
    id: string;
    role: string;
    goalCount: number;
    registrationsCount: number;
};

export type EventItem = {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    roleSlots: EventRoleSlot[];
};

export type EventData = {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    roleSlots: EventRoleSlot[];
};

export type EventModalProps = {
    isOpen: boolean;
    onClose: () => void;
    event: EventData | null;
    onUpdate?: (updated: EventData) => void;
};