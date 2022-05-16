import React, { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
    isOpened: boolean,
    title: string,
    onClose: ()=>void
}>

export default function Modal({isOpened, children, title, onClose}: ModalProps){
    return (
        <>
            <div className={`modal ${isOpened ? "show" : ""}`}>
                <div className="modal-container">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {title}
                            </h3>
                            <button className="modal-close" onClick={() => onClose()}> × </button>
                        </div>
                        <div className="modal-body">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
            <div className={"modal-backdrop"} onClick={(_)=>{onClose()}}></div>
        </>
    )
}

/*


*/