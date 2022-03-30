import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import Nav from "../components/sidebar";
import session from "../interfaces/session";
import { fetcherAuth } from "../utils/fetcher";
import SessionStorage from "../utils/session_storage";

export default function  AuthenticatedLayout({children} : React.PropsWithChildren<any>){
  const router = useRouter();
  const [message, setMessage] = useState<string|null>("Vérification de l'authentification");
  
  useEffect(()=>{
    (async()=>{
      if(SessionStorage.session == null){
        let session = await fetcherAuth<session>("/api/auth/check");

        if(session && typeof session != "string") {
          SessionStorage.session = session;
          setMessage(null);
        } else {
          setMessage("Redirection")
          router.push("/auth/login");
        }
      } else {
        setMessage(null);
      }
    })()
  },[])

  if(message) return <div className="h-100 flex items-center justify-center">{message}</div>;

  return(
    <div className="flex h-full relative items-stretch">
      <Nav/>
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}