import {object, string, date, number, setLocale } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
import yupFormattedDate from "../utils/yupFormattedDate";
setLocale(fr);

export const postSchema = object({
    subject: string().required(),
    date_start: yupFormattedDate().required(),
    date_end: yupFormattedDate(),
    daily_time_start: yupFormattedDate().required(),
    daily_time_end: yupFormattedDate().required(),
    creator_id: number(),
});
export const putSchema = object({
    subject: string(),
    date_start: date().transform((date)=>moment(date, "YYYY-MM-DD HH:mm:ss", true).format()),
    date_end: date().transform((date)=>moment(date, "YYYY-MM-DD HH:mm:ss", true).format()),
    daily_time_start: date().transform((date)=>moment(date, "HH:mm:ss", true).toDate()),
    daily_time_end: date().transform((date)=>moment(date, "HH:mm:ss", true).toDate()),
    creator_id: number(),
});