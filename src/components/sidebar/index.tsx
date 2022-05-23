import { faCalendarAlt, faMessage } from "@fortawesome/free-regular-svg-icons";
import { faAlignLeft, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import logo from "../../../assets/img/logo.png"
import Dropdown, {DropdownDirection} from "../dropdown";
import NavLink from "./sidebar-link";
import session from "../../interfaces/session";
import { removeCookies } from "cookies-next";
import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import getSession from "../../utils/get_session";
import { ReferenceActualEventContext } from "../../contexts/ReferenceGlobalCHatContext";
import { SocketState } from "../../interfaces/socketState";
import { ClientEvents } from "../../socket/Enums";

export default function Nav(){
  let [ses, setSes] = useState<session|undefined>()
  let router = useRouter();
  const session =  useRef(getSession());
  let eventCtx = useContext(ReferenceActualEventContext);
  let [showGlobalChatLink, setShowGlobalChatLink] = useState(eventCtx.globalChatSocketState.current != SocketState.deactivated);

  useEffect(()=>{
    if(document) document.addEventListener('eventContextUpdated', updateShowGlobalChatLink);
    return ()=>{
      if(document) document.removeEventListener('eventContextUpdated', updateShowGlobalChatLink);
    }
  }, []);
  
  function updateShowGlobalChatLink(){
    setShowGlobalChatLink(eventCtx.globalChatSocketState.current != SocketState.deactivated);
  }

  return(
    <nav className="sidebar">
      <div className="sidebar-logo"><Image src={logo}/></div>
      <h4 className="sidebar-title">LE TREFLE 2.0</h4>
      <div className="sidebar-links-wrapper">
        <NavLink text="Écoutes" icon={faMessage} path="/listens"/>
        <NavLink text="Planning" icon={faCalendarAlt} path="/events"/>
        {showGlobalChatLink ? 
          <NavLink text="Chat de permanence" icon={faAlignLeft} path="/globalChat" socket={eventCtx.globalChatSocket.current} socketEvent={ClientEvents.new_message}/>
        : null}
      </div>
      <div className="px-4 pb-6">
        <Dropdown toggler={
          <div className="font-medium px-4 py-2 rounded-2 hover:bg-trefle-green flex justify-between items-center">
            {session.current?.user?.name ?? "Déconnecté"}
            <FontAwesomeIcon icon={faAngleUp}/>
          </div>
        }
        direction={DropdownDirection.top}>
          <div className="btn white" onClick={()=>{
            removeCookies("session");
            router.reload();
          }}>Déconnexion</div>
        </Dropdown>
      </div>
    </nav>
  );
}
