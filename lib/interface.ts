import type {Reaction} from "@/generated/prisma/client"

export interface Msg {
    author: {
        id: string;
        name: string;
        image: string;
        role: string;
    },
    content: string;
    timestamp: number;
    channel: {
        id: string;
    },
    reactions: Reaction[] | null;
}

export interface MsgWithID extends Msg {
    id: number;
}

export interface formVolunteer {
    label: string,
    value: {
        id: string;
        name: string;
    },
}

export interface DisplayAccount {
    id: string;
    name: string;
    email: string;
    role: string;
    username?: string;
}

export interface Tickets {
    id: number;
    status: string;
    createdAt: Date;
    channelID: string;
    problematic: string | null;
    observations: string | null;
    info: string | null;
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