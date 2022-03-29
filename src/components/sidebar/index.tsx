import { faCalendarAlt, faMessage } from "@fortawesome/free-regular-svg-icons";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import logo from "../../../assets/img/logo.png"
import NavLink from "./sidebar-link";

export default function Nav(){
  return(
    <nav className="sidebar">
      <div className="sidebar-logo"><Image src={logo}/></div>
      <h4 className="sidebar-title">LE TREFLE 2.0</h4>
      <div className="sidebar-links-wrapper">
        <NavLink text="Écoutes" icon={faMessage} path="/listens"/>
        <NavLink text="Planning" icon={faCalendarAlt} path="/calendar"/>
        <NavLink text="Chat de permanence" icon={faAlignLeft} path="/chat"/>
      </div>
    </nav>
  );
}
