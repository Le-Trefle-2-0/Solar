"use client";
import {useParams} from "next/navigation";
import {Chat} from "@/components/chat";

export default function TicketChat() {
    const {id} = useParams();

    return (

        <Chat channelID={id as string}/>
    );
}