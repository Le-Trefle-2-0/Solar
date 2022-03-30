import JoiBase from "joi";
import JoiDate from "@joi/date";
const Joi = JoiBase.extend(JoiDate);

export const postSchema = Joi.object({
    subject: Joi.string().required(),
    date_start: Joi.date().format("YYYY-MM-DD HH:mm:ss").required(),
    date_end: Joi.date().format("YYYY-MM-DD HH:mm:ss"),
    daily_time_start: Joi.date().format("YYYY-MM-DD HH:mm:ss").required(),
    daily_time_end: Joi.date().format("YYYY-MM-DD HH:mm:ss").required(),
    creator_id: Joi.number().required(),
});
export const putSchema = Joi.object({
    subject: Joi.string(),
    date_start: Joi.date().format("YYYY-MM-DD HH:mm:ss"),
    date_end: Joi.date().format("YYYY-MM-DD HH:mm:ss"),
    daily_time_start: Joi.date().format("YYYY-MM-DD HH:mm:ss"),
    daily_time_end: Joi.date().format("YYYY-MM-DD HH:mm:ss"),
    creator_id: Joi.number(),
});