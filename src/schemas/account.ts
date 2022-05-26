import {object, string, date, number, setLocale } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
setLocale(fr);
const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/


export const postSchema = object({
    name: string().required(),
    tel: string().matches(phoneRegExp, {message: 'Numero de téléphone invalide.', excludeEmptyString: true}),
    password: string().required(),
    role_id: number().required()
});

export const putSchema = object({
    name: string(),
    tel: string().matches(phoneRegExp, {message: 'Numero de téléphone invalide.', excludeEmptyString: true}),
    password: string(),
    role_id: number()
});