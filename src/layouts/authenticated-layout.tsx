import { useRouter } from "next/router";
import React, { useEffect } from "react";
import useSWR from "swr";
import Nav from "../components/nav";
import { fetcherAuth } from "../utils/fetcher";

export default function  AuthenticatedLayout({children} : React.PropsWithChildren<any>){
  let validationSWR = useSWR<string|null>("/api/auth/check", (u) => fetcherAuth(u));
  let router = useRouter();

  console.log(validationSWR.data);

  if(validationSWR.data === undefined) return <>Vérification de l'authentification</>;


  if(validationSWR.data != "valid") {
    router.push("/auth/login");
    return <>Redirection</>;
  }

  return(
    <div className="flex">
      <Nav/>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}