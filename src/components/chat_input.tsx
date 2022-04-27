import { faPaperPlane, faSmile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmojiData, Picker } from "emoji-mart";
import { LegacyRef, useEffect, useState } from "react";
import { useClickOutside } from "react-click-outside-hook";
import mart_translation from "../utils/mart_translation";

interface ChatInputProps{
    onSubmitText: (text: string) => void
}

export default function ChatInput({onSubmitText}: ChatInputProps){
    const [text, setText] = useState("");
    const [caretPosition, setCaretPosition] = useState(0);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerRef, hasClickedOutsidePicker] = useClickOutside();

    function updateTextAreaHeight(textarea: HTMLTextAreaElement){
        textarea.style.height = 2.5+"rem";
        textarea.style.height = Math.min(5, textarea.scrollHeight / 16) + "rem"
    }

    useEffect(()=>{
        if(hasClickedOutsidePicker)setShowPicker(false);
    }, [hasClickedOutsidePicker]);

    function onSubmitTextLoc(text: string){
        setText("");
        if(text.trim() == "") return;
        setCaretPosition(0);
        onSubmitText(text.trim());
    }

    return(
        <div className="bg-trefle-ulight-blue rounded-3 py-2 flex">
            <textarea
                rows={1}
                placeholder="message..."
                onInput={({currentTarget})=>{ updateTextAreaHeight(currentTarget as HTMLTextAreaElement); setCaretPosition(currentTarget.selectionStart)}}
                onClick={({currentTarget})=>{ setCaretPosition(currentTarget.selectionStart) }}
                className="message-input flex-1"
                onChange={({currentTarget: {value}})=>{setText(value);}}
                value={text}
                style={text != "" ? {height: "2.5rem"} : undefined}
                onKeyPress={(e)=>{
                    if(e.key == "Enter" && !e.shiftKey) {
                        onSubmitTextLoc(text);
                        e.preventDefault()
                    }
                }}
            ></textarea>
            <div className="relative flex items-center px-3" ref={pickerRef as LegacyRef<HTMLDivElement>}>
            <button className="rounded-1 cursor-pointer hover:text-trefle-green transition" onClick={()=> setShowPicker(true)}>
                <FontAwesomeIcon icon={faSmile} size={"lg"}/>
            </button>
            <Picker
                style={{
                    display: !showPicker ? "none" : undefined,
                    position: "absolute",
                    bottom: "100%",
                    right: "0",
                }}
                native={true}
                onSelect={(e: EmojiData & {native:string})=>setText(text.slice(0,caretPosition)+e.native+text.slice(caretPosition))}
                i18n={mart_translation}
            />
            </div>
            <div className="relative flex items-center px-3 mr-2">
            <button className="rounded-1 cursor-pointer hover:text-trefle-green transition" onClick={()=> onSubmitTextLoc(text)}>
                <FontAwesomeIcon icon={faPaperPlane} size={"lg"}/>
            </button>
            </div>
        </div>
    );
}