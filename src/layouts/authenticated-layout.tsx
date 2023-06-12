import { useRouter } from "next/router";
import { memo, useEffect, useRef, useState } from "react";
import Nav from "../components/sidebar";
import getSession from "../utils/get_session";

export default function  AuthenticatedLayout({children} : React.PropsWithChildren<any>){
  const router = useRouter();
  const [message, setMessage] = useState<string|null>("Vérification de l'authentification");
  //const childrenRef = useRef(children);

  useEffect(()=>{
    (async()=>{
      let ses = getSession();
      if(!ses){
        setMessage("Redirection")
        router.push("/auth/login");
      } else {
        setMessage(null);
      }
    })()
  },[])

  if(message) return <div className="h-100 flex items-center justify-center">{message}</div>;

  return(
    <div className="flex h-full relative items-stretch">
      <Nav/>
      <div className="flex-1 p-8 overflow-auto content">
        {children}
      </div>
    </div>
  );
}