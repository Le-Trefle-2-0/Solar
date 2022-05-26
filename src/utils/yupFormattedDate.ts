import moment from "moment";
import { date } from "yup";

export default function yupFormattedDate(formats = ["YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "HH:mm:ss", "HH:mm", "YYYY/MM/DD", "YYYY/MM/DD HH:mm:ss", moment.ISO_8601]){
    return date().transform((date, initialValue)=>{
        if(initialValue == "" || initialValue == null) return null;
        let momentVal = moment.utc(initialValue, formats, true);
        if(!momentVal.isValid()){
            return "invalid";
        } else {
            return momentVal.toDate();
        }
    }).nullable().typeError("La date/heure est invalide")
}