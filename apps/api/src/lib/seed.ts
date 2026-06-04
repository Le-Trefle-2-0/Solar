import {prisma} from '../prisma.js';

export async function seedDefaultRoles() {
    console.log("[db] Ensuring default roles exist...");

    const adminPermissions = [
        "tickets.open", "tickets.close", "tickets.read_all", "tickets.attribute", "tickets.launch_voice",
        "tickets.send_message_all", "tickets.send_message", "tickets.transmission",
        "management.create_account", "management.delete_account", "management.ticket_history",
        "management.view_transmission", "management.view_stats", "management.reset_password",
        "permanence.open", "permanence.close", "permanence.register", "permanence.unregister",
        "permanence.unregister_other_all", "permanence.unregister_other_user", "permanence.register_other_all", "permanence.register_other_user",
        "messages.manage", "newsletters.manage",
        "user.create", "user.update", "user.delete", "user.read", "session.delete", "session.read", "impersonate.create"
    ];

    const volunteerPermissions = [
        "tickets.close", "tickets.launch_voice", "tickets.send_message", "tickets.transmission",
        "management.view_stats",
        "permanence.register", "permanence.unregister"
    ];

    try {
        await prisma.role.upsert({
            where: {name: "admin"},
            update: {},
            create: {
                name: "admin",
                weight: 100,
                permissions: JSON.stringify(adminPermissions),
                icon: "Shield"
            }
        });

        await prisma.role.upsert({
            where: {name: "volunteer"},
            update: {},
            create: {
                name: "volunteer",
                weight: 10,
                permissions: JSON.stringify(volunteerPermissions),
                icon: "Ear"
            }
        });

        console.log("[db] Default roles (admin, volunteer) verified.");
    } catch (error) {
        console.error("[db] Error seeding default roles:", error);
    }
}
