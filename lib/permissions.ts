import {createAccessControl} from "better-auth/plugins/access";
import {adminAc, defaultStatements} from "better-auth/plugins/admin/access";

export const statement = {
    ...defaultStatements,
    project: ['create', 'share', 'update', 'delete']
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
    project: ["create"],
});

export const admin = ac.newRole({
    project: ["create", "update"],
    ...adminAc.statements,
});

export const myCustomRole = ac.newRole({
    project: ["create", "update", "delete"],
});
