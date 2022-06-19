import {object, string, date, number, setLocale } from "yup";
import moment from "moment";
import { fr } from 'yup-locales';
setLocale(fr);


export const postSchema = object({
    name: string().required(),
    password: string().required()
  })