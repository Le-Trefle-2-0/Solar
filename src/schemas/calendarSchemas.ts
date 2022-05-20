import {object, string, date, number, setLocale, array } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
import yupFormattedDate from "../utils/yupFormattedDate";
setLocale(fr);

export const postSchema = object({
    subject: string().required(),
    date_start: yupFormattedDate().required(),
    date_end: yupFormattedDate().when("date_start", (date_start, schema) => {
        return schema.test({
          test: (date_end: any) => {
            if (!date_end) return true;
            return date_start <= date_end;
          },
          message: "La date de fin doit être suppérieure à la date de début",
        });
    }),
    daily_time_start: yupFormattedDate().required(),
    daily_time_end: yupFormattedDate().required().when("daily_time_start", (daily_time_start, schema) => {
        return schema.test({
          test: (daily_time_end: any) => {
            if (!daily_time_end) return true;
            return daily_time_start <= daily_time_end;
          },
          message: "L'heure de fin doit être suppérieure à l'heure de début",
        });
    }),
    creator_id: number(),
    needed_roles: array().of(object({
        role_id: number(),
        number: number()
    })).nullable(),
});
export const putSchema = object({
    subject: string(),
    date_start: yupFormattedDate(),
    date_end: yupFormattedDate().when("date_start", (date_start, schema) => {
        return schema.test({
          test: (date_end: any) => {
            if (!date_end) return true;
            return date_start <= date_end;
          },
          message: "La date de fin doit être suppérieure à la date de début",
        });
    }),
    daily_time_start: yupFormattedDate(),
    daily_time_end: yupFormattedDate().when("daily_time_start", (daily_time_start, schema) => {
        return schema.test({
          test: (daily_time_end: any) => {
            if (!daily_time_end) return true;
            return daily_time_start <= daily_time_end;
          },
          message: "L'heure de fin doit être suppérieure à l'heure de début",
        });
    }),
    creator_id: number(),
    needed_roles: array().of(object({
        role_id: number(),
        number: number()
    })).nullable(),
});