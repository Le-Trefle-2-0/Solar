import { postSchema as calendarPostSchema } from "../../../../src/schemas/calendarSchemas";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useState } from "react";
import Select from 'react-select';
import { accounts, roles } from "@prisma/client";
import moment from "moment";
import {CalendarEvent, CalendarEventWithRolesNeededAndRolesFilled} from "../../../interfaces/calendar"
import { ListenWithStatusAndAccounts } from "../../../interfaces/listens";

interface ServersideProps{
    accountsSSR: accounts[]
}


type FormProps = PropsWithChildren<{
    accounts: accounts[]|null|undefined,
    listen?: ListenWithStatusAndAccounts | null,
    onCancel?: () => void
}>

export default function ListensForm({accounts, listen, onCancel}: FormProps){
    const {register, handleSubmit, formState: { errors }, control, setValue} = useForm();
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const router = useRouter();

    const onSubmit = (data: any) => {
        setLoading(true);
        fetch(`/api/listens${listen ? `/${listen.id}/assignAccounts` : "" }`, {
            method: listen? 'PUT' : 'POST',
            body: JSON.stringify(data)
          })
          .then(
            (res) => {
                if(res.ok){
                    setShowPostResult(true);
                    setTimeout(() => {
                        onCancel?.call(undefined)
                    }, 2000)
                }
            }).catch((e)=>{
                //setError()
                setLoading(false);
            });
    };
    console.log('accounts')
    console.log(accounts)

    return (
        <>
            {showPostResult && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">Évenement correctement {event !== null ? "modifié" : "ajouté"}</div>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label> Sujet</label>
                    <Controller
                        control={control}
                        name="accounts"
                        render={({ field: {onChange, value, ref} })=>(   
                            <Select
                                ref={ref}
                                options={accounts?.map(a=>({label: a.name, value: a.id}))}
                                isMulti
                                className={`field react-select ${ !!errors.accounts?.length ? "error" : ""}`}
                                classNamePrefix="react-select"
                                placeholder="Sélectionnez..."
                            />
                        )}
                    />
                    <div className="text-red-500">{errors.subject?.message}</div>
                </div>
                <div className="flex justify-end">
                    <input type="button" value="Annuler" className="btn fake-white mr-2" onClick={()=> {onCancel?.call(undefined)}}/>
                    <input type="submit" value={`${event !== null ? "Modifier" : "Ajouter"}`} className={`btn ${loading ? "opacity-50 pointer-events-none" : ""}`}/>
                </div>
            </form>
        </>
    )
}

/*


*/