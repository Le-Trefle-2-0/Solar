"use client";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {User} from "better-auth";

export default function TicketChat() {
    const {id} = useParams();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        fetch(`/api/users/${id}`)
            .then(res => res.json())
            .then(data => setUser(data))
    }, []);

    return (
        <div>
            {user?.name}
        </div>
    );
}