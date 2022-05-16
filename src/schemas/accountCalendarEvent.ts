import {object, string, date, number, setLocale } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
setLocale(fr);


export const postSchema = object({
    account_id: number().required(),
    calendar_event_id: number().required(),
});

export const putSchema = object({
    account_id: number(),
    calendar_event_id: number(),
});