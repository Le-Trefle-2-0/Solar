export enum ClientEvents{
    auth_refused = "auth-refused",
    auth_accepted = "auth-accepted",
    auth_invalid = "auth-invalid",
    history = "history",
}

export enum ServerEvents{
    login = "login",
    disconnect = "disconnect",
    get_history = "get_history",
}