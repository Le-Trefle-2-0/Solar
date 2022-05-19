import { postSchema as calendarPostSchema } from "../../../../src/schemas/calendarSchemas";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useState } from "react";
import Select from 'react-select';
import { roles } from "@prisma/client";
import moment from "moment";
import {CalendarEvent, CalendarEventWithRolesNeededAndRolesFilled} from "../../../interfaces/calendar"

interface ServersideProps{
    rolesSSR: roles[]
}
interface needed_role{
    role_id: number,
    number: number
}

type FormProps = PropsWithChildren<{
    roles: roles[]|null,
    event?: CalendarEventWithRolesNeededAndRolesFilled,
}>

export default function EventsForm({roles, event}: FormProps){
    const {register, handleSubmit, watch, formState: { errors }, control, setValue, getValues} = useForm({resolver: yupResolver(calendarPostSchema)});
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [_roles, setRoles] = useState(roles || []);
    const router = useRouter();
    const rolesSelected: needed_role[] = watch("needed_roles");

        
    useEffect(()=>{
        let rolesSelectedTemp: needed_role[] = []
        event?.calendar_event_role_needed.forEach(cern=>{
            rolesSelectedTemp.push({number: cern.number, role_id: parseInt(cern.role_id.toString())})
        })
    }, [])

    const onSubmit = (data: any) => {
        console.log("on send",data.date_start)
        fetch(`/api/events`, {
            method: 'POST',
            body: JSON.stringify(data)
          })
          .then(
            (res) => {
              if(res.status == 201){
                setShowPostResult(true);
                setTimeout(() => {
                    router.push(`/events`)
                }, 2000)
              }
            });
    };

    const onErrors = (errors: any) => {
        console.log(getValues().date_start)
    }
    return (
        <>
            <form onSubmit={handleSubmit(onSubmit, onErrors)}>
                <div className="mb-4">
                    <label> Sujet</label>
                    <input className={`field ${errors.subject?.message ? "error" : ""}`}
                    type="text" {...register("subject")} 
                    defaultValue={event?.subject || ''}/>
                    <div className="text-red-500">{errors.subject?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Date de début de période</label>
                    <input className={`field ${errors.date_start?.message ? "error" : ""}`}
                    type="date" {...register("date_start")} 
                    defaultValue={moment(event?.date_start).format('YYYY-MM-DD')}/>
                    <div className="text-red-500">{errors.date_start?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Date de fin de période</label>
                    <input className={`field ${errors.date_end?.message ? "error" : ""}`}
                    type="date" {...register("date_end")} 
                    defaultValue={!! (event?.date_end) ? moment(event?.date_end).format('YYYY/MM/DD') : ''}/>
                    <div className="text-red-500">{errors.date_end?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Heure quotidienne de début</label>
                    <input className={`field ${errors.daily_time_start?.message ? "error" : ""}`}
                    type="time" {...register("daily_time_start")}
                    defaultValue={moment(event?.daily_time_start).format('HH:mm')}/>
                    <div className="text-red-500">{errors.daily_time_start?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Heure quotidienne de fin</label>
                    <input className={`field ${errors.daily_time_end?.message ? "error" : ""}`}
                    type="time" {...register("daily_time_end")}
                    defaultValue={moment(event?.daily_time_end).format('HH:mm')}/>
                    <div className="text-red-500">{errors.daily_time_end?.message}</div>
                </div>
                <div className="mb-4">
                    <label>Roles demandés</label>
                    <Controller
                        control={control}
                        name="needed_roles"
                        render={({ field: {onChange, value, ref} })=>(   
                            <Select
                                ref={ref}
                                options={_roles.map(r=>({label: r.label, value: r.id}))}
                                defaultValue={value ? _roles.filter(r=>value.map((c: needed_role) => c.role_id).includes(r.id)).map(r=>({label: r.label, value: r.id})) : null}
                                onChange={val => onChange(_roles.filter(r=>val.map(c => c.value).includes(r.id)).map(r=>({role_id: parseInt(r.id.toString()), number: 1} as needed_role)))}
                                isMulti
                                className={`field react-select ${errors.needed_roles?.message ? "error" : ""}`}
                                classNamePrefix="react-select"
                                placeholder="Sélectionnez..."
                            />
                        )}
                        />
                        <div className="text-red-500">{errors.needed_roles?.message}</div>
                </div>
                {
                    rolesSelected ? 
                        rolesSelected.map((n_role)=>{
                            let role = _roles.find(r=>r.id == BigInt(n_role.role_id))
                            if(!role) return;
                            return (
                                <div key={role.id+"_role_selected"} className="mb-4">
                                    <label> Nombre de {role.label}</label>
                                    <input className={`field ${errors.needed_roles?.message ? "error" : ""}`}
                                    type="number"
                                    defaultValue={n_role.number}
                                    onKeyUp={({currentTarget})=>{
                                        try{
                                            let value = Math.floor(parseFloat(currentTarget.value))
                                            setValue("needed_roles", rolesSelected.map(nr=>nr.role_id == n_role.role_id ? {...nr, number: value} as needed_role : nr))
                                        }catch{return;}
                                    }}/>
                                    <div className="text-red-500">{errors.needed_roles?.message}</div>
                                </div>
                                );
                        })
                    : null
                }
                {errors.exampleRequired && <span>This field is required</span>}
                <div className="flex justify-end">
                    <input type="button" value="Annuler" className="btn fake-white mr-2" onClick={()=>router.back()}/>
                    <input type="submit" value="Ajouter" className="btn"/>
                </div>
            </form>
        </>
    )
}

/*


*/