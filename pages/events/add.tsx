import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import Joi from "@hapi/joi"
import { postSchema as calendarPostSchema } from "../../src/schemas/calendarSchemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import session from "../../src/interfaces/session";

export default function add(){
    const { register, handleSubmit, watch, formState: { errors } } = useForm({resolver: yupResolver(calendarPostSchema)});
    const router = useRouter();

    const onSubmit = (data: any) => {
        console.log(data);
    };
    const onErrors = (errors: any) => {
        console.log(errors)
    }



    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2 className="">AJOUTER PERMANENCE</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit, onErrors)}>
                <div className="mb-4">
                    <label> Sujet</label>
                    <input className={`field ${errors.subject?.message ? "error" : ""}`}
                     type="text" {...register("subject")}/>
                    <div className="text-red-500">{errors.subject?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Date de début de période</label>
                    <input className={`field ${errors.date_start?.message ? "error" : ""}`}
                    type="date" {...register("date_start")}
                    defaultValue={new Date().toISOString()}/>
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
                    type="time" {...register("daily_time_start")}
                    defaultValue={new Date().toTimeString()}/>
                    <div className="text-red-500">{errors.daily_time_start?.message}</div>
                </div>
                <div className="mb-4">
                    <label> Heure quotidienne de fin</label>
                    <input className={`field ${errors.daily_time_end?.message ? "error" : ""}`}
                    type="time" {...register("daily_time_end")}
                    defaultValue={new Date().toTimeString()}/>
                    <div className="text-red-500">{errors.daily_time_end?.message}</div>
                </div>
                {errors.exampleRequired && <span>This field is required</span>}
                <div className="flex justify-end">
                    <input type="button" value="Annuler" className="btn fake-white mr-2" onClick={()=>router.back()}/>
                    <input type="submit" value="Ajouter" className="btn"/>
                </div>
            </form>
        </AuthenticatedLayout>
    )
}