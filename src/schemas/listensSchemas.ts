import {object, string, date, number, setLocale, bool, array } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
import yupFormattedDate from "../utils/yupFormattedDate";
setLocale(fr);


export const postSchema = object({
    user_discord_id_encrypted: string().required(),
    main_subject_encrypted: string().required(),
    date_time_start: yupFormattedDate(),
    is_user_minor: bool().required(),
    listen_status_id: number().required()
});
export const putSchema = object({
    listen_status_id: number(),
    volunteer_notes_encrypted: string(),
    volunteer_main_observations_encrypted: string()
});
export const filterSchema = object({
    id: number(),
    not_done: bool(),
    with_users: bool(),
    for_transcript: bool()
});
export const assignSchema = object({
    account_ids: array().of(number()),
});