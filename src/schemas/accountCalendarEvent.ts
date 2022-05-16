import JoiBase from "joi";
import JoiDate from "@joi/date";
const Joi = JoiBase.extend(JoiDate);

export const postSchema = Joi.object({
    account_id: Joi.number(),
    calendar_event_id: Joi.number(),
});
export const putSchema = Joi.object({
    account_id: Joi.number(),
    calendar_event_id: Joi.number(),
});