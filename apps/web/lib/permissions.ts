import {createAccessControl} from "better-auth/plugins/access";
import {adminAc, defaultStatements} from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    tickets: ['open', 'close', 'read_all', 'attribute', 'launch_voice', 'send_message_all', 'send_message', 'transmission'],
    management: ['create_account', 'delete_account', 'ticket_history', 'view_transmission', 'view_stats', 'reset_password'],
    permanence: ['open', 'close', 'register', 'unregister', 'unregister_other_all', 'unregister_other_user', 'register_other_all', 'register_other_user'],
    messages: ['manage'],
    newsletters: ['manage']
} as const;

export const ac = createAccessControl(statement);

export const newsletterManager = ac.newRole({
    newsletters: ['manage']
});

export const training = ac.newRole({
    tickets: ['close', 'read_all', 'send_message', 'transmission'],
    management: ['view_transmission', 'view_stats'],
    permanence: ['register', 'unregister']
});

export const volunteer = ac.newRole({
    tickets: ['close', 'launch_voice', 'send_message', 'transmission'],
    management: ['view_stats'],
    permanence: ['register', 'unregister']
});

export const manager = ac.newRole({
    tickets: ['close', 'read_all', 'attribute', 'launch_voice', 'send_message_all'],
    management: ['create_account', 'ticket_history', 'view_transmission', 'view_stats', 'reset_password'],
    permanence: ['open', 'close', 'register', 'unregister', 'register_other_user', 'unregister_other_user'],
    messages: ['manage']
});

export const bot = ac.newRole({
    tickets: ['open', 'close', 'read_all', 'send_message_all']
});

export const admin = ac.newRole({
    ...adminAc.statements,
    tickets: ['open', 'close', 'read_all', 'attribute', 'launch_voice', 'send_message_all', 'send_message', 'transmission'],
    management: ['create_account', 'delete_account', 'ticket_history', 'view_transmission', 'view_stats', 'reset_password'],
    permanence: ['open', 'close', 'register', 'unregister', 'unregister_other_all', 'unregister_other_user', 'register_other_all', 'register_other_user'],
    messages: ['manage']
});
