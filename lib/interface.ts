import type {Reaction, User} from "@/generated/prisma/client"

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
    discordID: string | null;
    reactions: Reaction[] | null;
    replyID?: number | null;
    edited?: boolean;
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
    lastTicketTimestamp: number;
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

export type EventRoleSlot = {
    id: string;
    role: string;
    goalCount: number;
    registrationsCount: number;
    part?: 'first' | 'second' | null;
    registrations: {
        userId: string;
    }[];
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

export type vigi = {
    date: Date;
    motive: string;
}

export type ticketInfo = {
    vigis: vigi[];
    ineligible: User[];
    voiceIneligible: User[];
}