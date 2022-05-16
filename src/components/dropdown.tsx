import React, { PropsWithChildren, ReactNode, useRef, useState, LegacyRef } from "react";
import useOnClickOutside from "../utils/useOnClickOutside";

export enum DropdownDirection{top="dropdown-top", bottom="dropdown-bottom"}
export enum DropdownAlignment{left="dropdown-left", right="dropdown-rigth"}
export enum DropdownState{shown="show", hidden=""}

type DropdownProps = PropsWithChildren<{
    toggler: ReactNode,
    direction?: DropdownDirection,
    alignment?: DropdownAlignment,
}>

export default function Dropdown({toggler, alignment = DropdownAlignment.left, direction = DropdownDirection.bottom, children}: DropdownProps){
    let [toggled, setToggled] = useState(DropdownState.hidden);
    let contentRef = useRef<HTMLDivElement>();
    useOnClickOutside(contentRef, toggleOff);

    function toggle(){
        if(toggled == DropdownState.shown) {
            setToggled(DropdownState.hidden);
        } else {
            setToggled(DropdownState.shown);
        }
    }

    function toggleOff(){
        if(toggled == DropdownState.shown) {setToggled(DropdownState.hidden);}
    }

    return(
        <div className={`dropdown ${direction} ${alignment}`}>
            <div className="dropdown-toggler" onClick={()=>toggle()}>{toggler}</div>
            <div ref={contentRef as LegacyRef<HTMLDivElement>} className={`dropdown-content ${toggled}`}>
                {children}
            </div>
        </div>
    );
}