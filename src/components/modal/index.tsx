import React, { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
    isOpened: boolean,
    title: string,
    onClose: ()=>void,
    expand?: boolean
}>

export default function Modal({isOpened, children, title, onClose, expand}: ModalProps){
    return (
        <>
            <div className={`modal ${isOpened ? "show" : ""}`} onClick={() => onClose()}>
                <div className={`modal-content ${expand ? " min-h-full" : ""}`} onClick={(e) => e.stopPropagation()}>
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
        </>
    )
}

/*


*/