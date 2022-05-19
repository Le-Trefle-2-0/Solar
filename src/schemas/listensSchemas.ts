import {object, string, date, number, setLocale, bool, array } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
import yupFormattedDate from "../utils/yupFormattedDate";
setLocale(fr);


export const postSchema = object({
    user_discord_id_encrypted: string(),
    user_age_encrypted: string(),
    main_subject_encrypted: string(),
    date_time_start: yupFormattedDate(),
    is_user_minor: bool().required(),
    listen_status_id: number().required()
});
export const putSchema = object({
    user_discord_id_encrypted: string(),
    user_age_encrypted: string(),
    main_subject_encrypted: string(),
    date_time_start: date(),
    is_user_minor: bool(),
    listen_status_id: number()
});
export const filterSchema = object({
    id: number(),
    not_done: bool(),
    with_users: bool()
});
export const assignSchema = object({
    account_ids: array().of(number()),
});