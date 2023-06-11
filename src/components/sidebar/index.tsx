import { faCalendarAlt, faMessage } from "@fortawesome/free-regular-svg-icons";
import { faAlignLeft, faAngleUp, faBook, faUsers, faChartColumn, faBars } from "@fortawesome/free-solid-svg-icons";
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
import useSWR from "swr";
import { ListenWithStatusAndAccounts } from "../../interfaces/listens";
import fetcher from "../../utils/fetcher";

export default function Nav(){
  let [ses, setSes] = useState<session|undefined>()
  let router = useRouter();
  const session =  useRef(getSession());
  let eventCtx = useContext(ReferenceActualEventContext);
  let [showGlobalChatLink, setShowGlobalChatLink] = useState(eventCtx.globalChatSocketState.current != SocketState.deactivated);
  const listensSwr = useSWR<ListenWithStatusAndAccounts[]|null>("/api/listens?not_done=true&with_users=true", fetcher);
  let listens = listensSwr.data || [];
  if(typeof listensSwr.data == "string") listens = [];

  useEffect(()=>{
    if(typeof document !== 'undefined') document.addEventListener('eventContextUpdated', updateShowGlobalChatLink);
    return ()=>{
      if(typeof document !== 'undefined') document.removeEventListener('eventContextUpdated', updateShowGlobalChatLink);
    }
  }, []);
  
  function updateShowGlobalChatLink(){
    setShowGlobalChatLink(eventCtx.globalChatSocketState.current != SocketState.deactivated);
  }

  return(
    <div className="responsive-sidebar">
      <div className="sidebar-toggle" onClick={() => {
        let sidebar = document.querySelector(".sidebar") as HTMLElement;
        sidebar.classList.toggle("sidebar-open");
      }}>
        <FontAwesomeIcon icon={faBars}/>
      </div>
      <nav className="sidebar">
        <div className="sidebar-logo"><Image src={logo}/></div>
        <h4 className="sidebar-title">LE TREFLE 2.0</h4>
        <div className="sidebar-links-wrapper">
          {
            (session.current?.user.is_admin || session.current?.user.is_ref) ?
            <NavLink text="Écoutes" icon={faMessage} path="/listens"/> : null
          }
          {
            session.current?.user.is_listener ? (listens.map((l,k) => (
              <NavLink text={`Écoute ${l.id}`} icon={faMessage} path={`/listens/${l.id}`}/>
            ))) : null
          }
          <NavLink text="Planning" icon={faCalendarAlt} path="/events"/>
          {
            showGlobalChatLink ? 
              <NavLink text="Permanence" icon={faAlignLeft} path="/globalChat" socket={eventCtx.globalChatSocket.current} socketEvent={ClientEvents.new_message}/>
            : null
          }
          {
            session.current?.user.is_admin ? 
              <>
                <NavLink text="Comptes" icon={faUsers} path="/accounts"/>
                <NavLink text="Transcripts" icon={faBook} path="/transcripts"/>
                <NavLink text="Statistiques" icon={faChartColumn} path="/stats"/>
              </>
            : null
          }
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
    </div>
  );
}
