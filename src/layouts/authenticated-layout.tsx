import React from "react";
import Nav from "../components/nav";

export default function  AuthenticatedLayout({children} : React.PropsWithChildren<any>){
  return(
    <div className="flex">
      <Nav/>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}