import {object, string, date, number, setLocale } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
setLocale(fr);
const emailRegex = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/


export const postSchema = object({
    name: string().required(),
    email: string().matches(emailRegex, {message: 'Courriel invalide.', excludeEmptyString: true}),
    password: string().required(),
    role_id: number().required()
});

export const putSchema = object({
    name: string(),
    email: string().matches(emailRegex, {message: 'Courriel invalide.', excludeEmptyString: true}),
    password: string(),
    role_id: number()
});