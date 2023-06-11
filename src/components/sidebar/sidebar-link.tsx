import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Socket } from 'socket.io-client';

interface NavLinkProps{
  text: string,
  icon: IconProp,
  path: string,
  socket?:Socket,
  socketEvent?:string
}

export default function NavLink({text, icon, path, socket, socketEvent} : NavLinkProps){
  let [showBadge, setShowBadge] = useState(false);
  const router = useRouter();

  useEffect(()=>{
    if(socket && socketEvent) socket.on(socketEvent, ()=>{setShowBadge(true)});
    return ()=> {
      if(socket && socketEvent) socket.off(socketEvent);
    }
  }, [])

  let isSameRouteStart = router.pathname.startsWith(path);
  console.log(router.pathname, path, isSameRouteStart);
  let isSameRoute = router.pathname == path;

  return (
    <div 
      className={`sidebar-link ${isSameRouteStart ? "active" : ""}`}
      onClick={()=>{if(!isSameRoute) router.push(path); setShowBadge(false);}}
    >
      <div className="relative inline-block">
        <FontAwesomeIcon icon={icon} className="mr-3"/>
        {showBadge && !isSameRoute ? <div className="h-2 w-2 rounded-full bg-red-500 absolute top-1 right-2"/> : null}
      </div>
      {text}
    </div>
  );
}