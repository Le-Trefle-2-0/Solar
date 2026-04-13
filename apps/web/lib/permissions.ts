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

export const PERMISSION_METADATA: Record<string, { label: string, category: string }> = {
    // Tickets
    'tickets.open': {label: 'Ouvrir des tickets', category: 'Tickets'},
    'tickets.close': {label: 'Fermer des tickets', category: 'Tickets'},
    'tickets.read_all': {label: 'Voir tous les tickets', category: 'Tickets'},
    'tickets.attribute': {label: 'Attribuer des tickets', category: 'Tickets'},
    'tickets.launch_voice': {label: 'Lancer des appels voix', category: 'Tickets'},
    'tickets.send_message_all': {label: 'Envoyer messages à tous', category: 'Tickets'},
    'tickets.send_message': {label: 'Envoyer des messages', category: 'Tickets'},
    'tickets.transmission': {label: 'Faire des transmissions', category: 'Tickets'},

    // Management
    'management.create_account': {label: 'Créer des comptes', category: 'Gestion'},
    'management.delete_account': {label: 'Supprimer des comptes', category: 'Gestion'},
    'management.ticket_history': {label: 'Historique des tickets', category: 'Gestion'},
    'management.view_transmission': {label: 'Voir les transmissions', category: 'Gestion'},
    'management.view_stats': {label: 'Voir les statistiques', category: 'Gestion'},
    'management.reset_password': {label: 'Réinitialiser les mots de passe', category: 'Gestion'},

    // Permanence
    'permanence.open': {label: 'Ouvrir la permanence', category: 'Permanence'},
    'permanence.close': {label: 'Fermer la permanence', category: 'Permanence'},
    'permanence.register': {label: 'S\'inscrire au planning', category: 'Permanence'},
    'permanence.unregister': {label: 'Se désinscrire du planning', category: 'Permanence'},
    'permanence.unregister_other_all': {label: 'Désinscrire n\'importe qui', category: 'Permanence'},
    'permanence.unregister_other_user': {label: 'Désinscrire d\'autres utilisateurs', category: 'Permanence'},
    'permanence.register_other_all': {label: 'Inscrire n\'importe qui', category: 'Permanence'},
    'permanence.register_other_user': {label: 'Inscrire d\'autres utilisateurs', category: 'Permanence'},

    // Messages & Newsletters
    'messages.manage': {label: 'Gérer les messages système', category: 'Communication'},
    'newsletters.manage': {label: 'Gérer les newsletters', category: 'Communication'},

    // Admin (Better Auth default)
    'user.create': {label: 'Créer des utilisateurs', category: 'Système'},
    'user.update': {label: 'Modifier des utilisateurs', category: 'Système'},
    'user.delete': {label: 'Supprimer des utilisateurs', category: 'Système'},
    'user.read': {label: 'Voir les utilisateurs', category: 'Système'},
    'session.delete': {label: 'Révoquer des sessions', category: 'Système'},
    'session.read': {label: 'Voir les sessions', category: 'Système'},
    'impersonate.create': {label: 'Incarner un utilisateur', category: 'Système'},
};

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
