import { accounts, roles } from "@prisma/client";

export default interface session{
    jwt: string | null,
    otp: boolean,
    user: sessionAccountWithRoles
}

export type sessionAccountWithRoles = sessionAccount & {
    roles: roles, 
    password?:string,
    otp_secret?:string
    otp_enabled?:boolean
};

export interface sessionAccount extends Omit<accounts, 'password'> {
    password?:string,
    is_admin: boolean,
    is_bot: boolean,
    is_ref: boolean,
    is_listener: boolean,
    is_training: boolean,
}