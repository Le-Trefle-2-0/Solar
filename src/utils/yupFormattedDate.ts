import moment from "moment";
import { date } from "yup";

export default function yupFormattedDate(formats = ["YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "HH:mm:ss", "HH:mm", "YYYY/MM/DD", "YYYY/MM/DD HH:mm:ss"]){
    return date().transform((date, initialValue)=>{
        if(initialValue == "") return null;
        let momentVal = moment(initialValue, formats, true);
        if(!momentVal.isValid()){
            console.log(momentVal, initialValue)
            return "invalid";
        } else {
            return momentVal.toDate();
        }
    }).nullable().typeError("La date/heure est invalide")
}