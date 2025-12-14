import {Resend} from "resend";

export function getResendClient() {
    return new Resend(process.env.RESEND_API_KEY!);
}