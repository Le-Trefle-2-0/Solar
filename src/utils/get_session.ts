import { getCookie } from "cookies-next";
import session from "../interfaces/session";

export default function getSession() : session | undefined {
    let sesRaw = getCookie("session");
    let ses: session | undefined;
    if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
    return ses;
}