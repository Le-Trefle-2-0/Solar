import { getCookie } from "cookies-next";
import session from "../interfaces/session";

export default function getSession() : session | undefined {
    let sesRaw = getCookie("session");
    let ses: session | undefined;
    if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
    if(ses){
        ses.user.json.is_admin = ["admin"].includes(ses.user.json.roles.name);
        ses.user.json.is_ref = ["admin", "be_ref"].includes(ses.user.json.roles.name);
        ses.user.json.is_bot = ["bot"].includes(ses.user.json.roles.name);
    }
    return ses;
}