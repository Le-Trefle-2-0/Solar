export enum ClientEvents{
    auth_refused = "auth-refused",
    auth_accepted = "auth-accepted",
    auth_invalid = "auth-invalid",
    auth_removed = "auth_removed",
    history = "history",
    new_message = "new_message"
}

export enum ServerEvents{
    login = "login",
    logout = "logout",
    get_history = "get_history",
    send_message = "send_message",
}