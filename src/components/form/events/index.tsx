import { postSchema as calendarPostSchema } from "../../../../src/schemas/calendarSchemas";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import { PropsWithChildren, useEffect, useState } from "react";
import Select from 'react-select';
import { roles } from "@prisma/client";
import moment from "moment";
import {CalendarEventWithRolesNeededAndRolesFilled} from "../../../interfaces/calendar"

interface ServersideProps{
    rolesSSR: roles[]
}
interface needed_role{
    role_id: number,
    number: number
}

type FormProps = PropsWithChildren<{
    roles: roles[]|null,
    event?: CalendarEventWithRolesNeededAndRolesFilled | null,
    onCancel?: () => void,
    onSuccess?: () => void,
}>

export default function EventsForm({roles, event, onCancel, onSuccess}: FormProps){
    const {register, handleSubmit, watch, formState: { errors }, control, setValue} = useForm({resolver: yupResolver(calendarPostSchema), defaultValues: {
        subject: event?.subject || '',
        date_start: moment.utc(event?.date_start || undefined).format('YYYY-MM-DD'),
        date_end: !! (event?.date_end) ? moment.utc(event?.date_end || undefined).format('YYYY/MM/DD') : undefined,
        daily_time_start: moment.utc(event?.daily_time_start || undefined).format('HH:mm'),
        daily_time_end: moment.utc(event?.daily_time_end || undefined).format('HH:mm'),
        needed_roles: event?.calendar_event_role_needed.map(ernp=>({role_id: parseInt(ernp.role_id.toString()), number: ernp.number} as needed_role)) || []
    }});
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [_roles, setRoles] = useState(roles || []);
    const rolesSelected: needed_role[] = watch("needed_roles");

        
    useEffect(()=>{
        let rolesSelectedTemp: needed_role[] = []
        event?.calendar_event_role_needed.forEach(cern=>{
            rolesSelectedTemp.push({number: cern.number, role_id: parseInt(cern.role_id.toString())})
        })
    }, [])

    const onSubmit = (data: any) => {
        setLoading(true);
        fetch(`/api/events${event ? `/${event.id}` : "" }`, {
            method: event? 'PUT' : 'POST',
            body: JSON.stringify(data)
          })
          .then(
            (res) => {
                if(res.ok){
                    setShowPostResult(true);
                    setTimeout(() => {
                        onSuccess?.call(undefined)
                    }, 2000)
                }
            }).catch((e)=>{
                //setError()
                setLoading(false);
            });
    };

    return (
        <>
            {showPostResult && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">Évenement correctement {event !== null ? "modifié" : "ajouté"}</div>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label> Sujet</label>
                    <input className={`field ${errors.subject?.message ? "error" : ""}`}
                    type="text" {...register("subject")}/>
                    <div className="text-red-500">{errors.subject?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Date de début de période</label>
                    <input className={`field ${errors.date_start?.message ? "error" : ""}`}
                    type="date" {...register("date_start")}/>
                    <div className="text-red-500">{errors.date_start?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Date de fin de période</label>
                    <input className={`field ${errors.date_end?.message ? "error" : ""}`}
                    type="date" {...register("date_end")}/>
                    <div className="text-red-500">{errors.date_end?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Heure quotidienne de début</label>
                    <input className={`field ${errors.daily_time_start?.message ? "error" : ""}`}
                    type="time" {...register("daily_time_start")}/>
                    <div className="text-red-500">{errors.daily_time_start?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Heure quotidienne de fin</label>
                    <input className={`field ${errors.daily_time_end?.message ? "error" : ""}`}
                    type="time" {...register("daily_time_end")}/>
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
                                defaultValue={value ? _roles.filter(r=>value.map((c: needed_role) => c.role_id).includes(parseInt(r.id.toString()))).map(r=>({label: r.label, value: r.id})) : null}
                                onChange={val => onChange(_roles.filter(r=>val.map(c => c.value).includes(r.id)).map(r=>({role_id: parseInt(r.id.toString()), number: 1} as needed_role)))}
                                isMulti
                                className={`field react-select ${ !!errors.needed_roles?.length ? "error" : ""}`}
                                classNamePrefix="react-select"
                                placeholder="Sélectionnez..."
                            />
                        )}
                    />
                    <div className="text-red-500">{errors.needed_roles?.[0]?.role_id?.message}</div>
                    <div className="text-red-500">{errors.needed_roles?.[0]?.number?.message}</div>
                </div>
                {
                    rolesSelected ? 
                        rolesSelected.map((n_role, index)=>{
                            let role = _roles.find(r=>r.id == BigInt(n_role.role_id))
                            if(!role) return;
                            return (
                                <div key={role.id+"_role_selected"} className="mb-4">
                                    <label> Nombre de {role.label}</label>
                                    <input className={`field ${ errors.needed_roles?.[index]?.role_id?.message ? "error" : ""}`}
                                    type="number"
                                    defaultValue={n_role.number}
                                    onKeyUp={({currentTarget})=>{
                                        try{
                                            let value = Math.floor(parseFloat(currentTarget.value))
                                            setValue("needed_roles", rolesSelected.map(nr=>nr.role_id == n_role.role_id ? {...nr, number: value} as needed_role : nr))
                                        }catch{return;}
                                    }}/>
                                    <div className="text-red-500">{errors.needed_roles?.[index]?.role_id?.message}</div>
                                </div>
                            );
                        })
                    : null
                }
                <div className="flex justify-end">
                    <input type="button" value="Annuler" className="btn fake-white mr-2" onClick={()=> {onCancel?.call(undefined)}} />
                    <input type="submit" value={`${event !== null ? "Modifier" : "Ajouter"}`} className={`btn ${loading ? "opacity-50 pointer-events-none" : ""}`}/>
                </div>
            </form>
        </>
    )
}

/*


*/