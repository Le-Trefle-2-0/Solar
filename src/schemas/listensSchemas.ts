import JoiBase from "joi";
import JoiDate from "@joi/date";
const Joi = JoiBase.extend(JoiDate);

export const postSchema = Joi.object({
    user_discord_id_encrypted: Joi.string(),
    user_age_encrypted: Joi.string(),
    main_subject_encrypted: Joi.string(),
    date_time_start: Joi.date().format("YYYY-MM-DD HH:mm:ss").required(),
    is_user_minor: Joi.bool().required(),
    listen_status_id: Joi.number().required()
});
export const putSchema = Joi.object({
    user_discord_id_encrypted: Joi.string(),
    user_age_encrypted: Joi.string(),
    main_subject_encrypted: Joi.string(),
    date_time_start: Joi.date(),
    is_user_minor: Joi.bool(),
    listen_status_id: Joi.number()
});
export const filterSchema = Joi.object({
    not_done: Joi.boolean()
});