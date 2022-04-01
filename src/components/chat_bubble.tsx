interface ChatBubbleProps{
    text: string,
    author: string,
    is_me: boolean
}

export default function ChatBubble({author, text, is_me} : ChatBubbleProps){
    return(
        <div className={`flex items-end ${is_me ? "flex-row-reverse" : ""}`}>
            <svg width="14" height="19" viewBox="0 0 14 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={is_me ? "transform -scale-x-100" : ""}>
                <path d="M0 19C11.9107 11.2051 13.9643 3.18291 13.9643 0L16.3654 15.3624L23 19H0Z" className={is_me ? "fill-gray-200" : "fill-trefle-light-green"}/>
            </svg>
            <div className={`flex-1 flex ${is_me ? "items-end" : "items-start"} flex-col max-w-8/10`}>
                <div>{author == "bot" ? "utilisateur" : author}</div>
                <div className={`p-4 rounded-t-3 ${is_me ? "rounded-l-3 bg-gray-200" : "rounded-r-3 bg-trefle-light-green"}  whitespace-pre-wrap`}>
                    {text}
                </div>
            </div>
        </div>
    );
}