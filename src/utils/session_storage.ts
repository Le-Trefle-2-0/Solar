import { accounts, roles } from "@prisma/client";
import session from "../interfaces/session";



export default class SessionStorage{
    private constructor(){}
    static get session () : session | null {
        let stored = sessionStorage.getItem("user")
        return (stored ? JSON.parse(stored) : null) as session | null
    }
    static set session (user : session | null) {
        if(user){
            sessionStorage.setItem("user", JSON.stringify(user))
        } else {
            sessionStorage.removeItem("user")
        }
    }
}