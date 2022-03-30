import CryptoJS from "crypto-js";

export default class MessageEncryptService{
    static encrypt(message: string) : string {
        return CryptoJS.AES.encrypt(message, process.env.APP_SECRET || "").toString();
    }
    static decrypt(message: string) : string {
        return CryptoJS.AES.decrypt(message, process.env.APP_SECRET || "").toString(CryptoJS.enc.Utf8);
    }
}