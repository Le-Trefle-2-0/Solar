import {createAccessControl} from "better-auth/plugins/access";
import {adminAc, defaultStatements} from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    tickets: ['open', 'close', 'read_all', 'attribute', 'launch_voice', 'send_message_all', 'send_message', 'transmission'],
    management: ['create_account', 'delete_account', 'ticket_history', 'view_transmission', 'view_stats', 'reset_password'],
    permanence: ['open', 'close', 'register', 'unregister', 'unregister_other_all', 'unregister_other_user', 'register_other_all', 'register_other_user'],
    messages: ['manage'],
    newsletters: ['manage'],
    admin: ['sudo']
} as const;

export interface PermissionInfo {
    id: string;
    label: string;
    description: string;
    category: string;
}

export const PERMISSION_METADATA: Record<string, PermissionInfo> = {
    // Tickets
    'tickets.open': {
        id: 'tickets.open',
        label: 'Ouvrir des tickets',
        description: 'Permet de créer de nouveaux tickets d\'écoute',
        category: 'Tickets'
    },
    'tickets.close': {
        id: 'tickets.close',
        label: 'Fermer des tickets',
        description: 'Permet de clôturer une session d\'écoute terminée',
        category: 'Tickets'
    },
    'tickets.read_all': {
        id: 'tickets.read_all',
        label: 'Voir tous les tickets',
        description: 'Accès en lecture à l\'ensemble des tickets de l\'organisation',
        category: 'Tickets'
    },
    'tickets.attribute': {
        id: 'tickets.attribute',
        label: 'Attribuer des tickets',
        description: 'Permet d\'assigner un ticket à un membre spécifique',
        category: 'Tickets'
    },
    'tickets.launch_voice': {
        id: 'tickets.launch_voice',
        label: 'Lancer des appels voix',
        description: 'Permet d\'initier une communication vocale via le widget',
        category: 'Tickets'
    },
    'tickets.send_message_all': {
        id: 'tickets.send_message_all',
        label: 'Envoyer messages à tous',
        description: 'Permet d\'écrire dans toutes les écoutes',
        category: 'Tickets'
    },
    'tickets.send_message': {
        id: 'tickets.send_message',
        label: 'Envoyer des messages',
        description: 'Permet d\'écrire dans une écoute',
        category: 'Tickets'
    },
    'tickets.transmission': {
        id: 'tickets.transmission',
        label: 'Faire des transmissions',
        description: 'Permet de rédiger le compte-rendu final de l\'écoute',
        category: 'Tickets'
    },

    // Management
    'management.create_account': {
        id: 'management.create_account',
        label: 'Créer des comptes',
        description: 'Permet d\'inviter de nouveaux membres dans l\'organisation',
        category: 'Gestion'
    },
    'management.delete_account': {
        id: 'management.delete_account',
        label: 'Supprimer des comptes',
        description: 'Permet de révoquer l\'accès d\'un membre',
        category: 'Gestion'
    },
    'management.ticket_history': {
        id: 'management.ticket_history',
        label: 'Historique des tickets',
        description: 'Accès aux archives et transcriptions des anciennes écoutes',
        category: 'Gestion'
    },
    'management.view_transmission': {
        id: 'management.view_transmission',
        label: 'Voir les transmissions',
        description: 'Permet de consulter les comptes-rendus d\'écoute',
        category: 'Gestion'
    },
    'management.view_stats': {
        id: 'management.view_stats',
        label: 'Voir les statistiques',
        description: 'Accès au tableau de bord d\'activité et indicateurs',
        category: 'Gestion'
    },
    'management.reset_password': {
        id: 'management.reset_password',
        label: 'Réinitialiser les mots de passe',
        description: 'Permet de déclencher un email de récupération pour un membre',
        category: 'Gestion'
    },

    // Permanence
    'permanence.open': {
        id: 'permanence.open',
        label: 'Ouvrir la permanence',
        description: 'Permet d\'activer la réception de nouveaux tickets',
        category: 'Permanence'
    },
    'permanence.close': {
        id: 'permanence.close',
        label: 'Fermer la permanence',
        description: 'Permet de désactiver le widget de contact',
        category: 'Permanence'
    },
    'permanence.register': {
        id: 'permanence.register',
        label: 'S\'inscrire au planning',
        description: 'Permet de se positionner sur un créneau de garde',
        category: 'Permanence'
    },
    'permanence.unregister': {
        id: 'permanence.unregister',
        label: 'Se désinscrire du planning',
        description: 'Permet de retirer sa présence d\'un créneau',
        category: 'Permanence'
    },
    'permanence.unregister_other_all': {
        id: 'permanence.unregister_other_all',
        label: 'Désinscrire n\'importe qui',
        description: 'Permet de retirer n\'importe quel membre du planning',
        category: 'Permanence'
    },
    'permanence.unregister_other_user': {
        id: 'permanence.unregister_other_user',
        label: 'Désinscrire d\'autres utilisateurs',
        description: 'Permet de gérer les inscriptions des pairs',
        category: 'Permanence'
    },
    'permanence.register_other_all': {
        id: 'permanence.register_other_all',
        label: 'Inscrire n\'importe qui',
        description: 'Permet d\'ajouter n\'importe quel membre au planning',
        category: 'Permanence'
    },
    'permanence.register_other_user': {
        id: 'permanence.register_other_user',
        label: 'Inscrire d\'autres utilisateurs',
        description: 'Permet d\'aider les pairs à s\'inscrire',
        category: 'Permanence'
    },

    // Communication
    'messages.manage': {
        id: 'messages.manage',
        label: 'Gérer les messages système',
        description: 'Configuration des messages automatiques et d\'accueil',
        category: 'Communication'
    },
    'newsletters.manage': {
        id: 'newsletters.manage',
        label: 'Gérer les newsletters',
        description: 'Création et envoi de communications aux bénéficiaires',
        category: 'Communication'
    },

    // Admin
    'admin.sudo': {
        id: 'admin.sudo',
        label: 'Super-administrateur (Sudo)',
        description: 'Outrepasse toutes les restrictions de permissions',
        category: 'Administration'
    },

    // Système (Better Auth default)
    'user.create': {
        id: 'user.create',
        label: 'Créer des utilisateurs (Système)',
        description: 'Accès technique à la création d\'utilisateurs Auth',
        category: 'Système'
    },
    'user.update': {
        id: 'user.update',
        label: 'Modifier des utilisateurs (Système)',
        description: 'Accès technique à la modification d\'utilisateurs Auth',
        category: 'Système'
    },
    'user.delete': {
        id: 'user.delete',
        label: 'Supprimer des utilisateurs (Système)',
        description: 'Accès technique à la suppression d\'utilisateurs Auth',
        category: 'Système'
    },
    'user.read': {
        id: 'user.read',
        label: 'Voir les utilisateurs (Système)',
        description: 'Accès technique à la liste des utilisateurs Auth',
        category: 'Système'
    },
    'session.delete': {
        id: 'session.delete',
        label: 'Révoquer des sessions',
        description: 'Permet de déconnecter de force un utilisateur',
        category: 'Système'
    },
    'session.read': {
        id: 'session.read',
        label: 'Voir les sessions',
        description: 'Consultation des connexions actives',
        category: 'Système'
    },
    'impersonate.create': {
        id: 'impersonate.create',
        label: 'Incarner un utilisateur',
        description: 'Permet de se connecter à la place d\'un autre membre',
        category: 'Système'
    },
};

export const ac = createAccessControl(statement);

/**
 * Enhanced permission check that honors admin.sudo
 */
export function hasPermission(userPermissions: string[], permission: string): boolean {
    if (userPermissions.includes('admin.sudo')) return true;
    return userPermissions.includes(permission);
}

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
    messages: ['manage'],
    admin: ['sudo']
});
