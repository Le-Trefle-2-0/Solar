import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../../src/middlewares/checkJWT";
import prisma_instance from './../../../../src/utils/prisma_instance';
import MessageEncryptService from './../../../../src/utils/message_encrypt_service';

export default connect().get(checkJWT, async (req: NextApiRequestWithUser, res) => {
    if(!req.session.user.is_admin) {
        res.status(403).send("forbidden")
        return;
    }
    let listen = await prisma_instance.listens.findUnique({where:{id:parseInt(req.query.id as string)}, include:{listen_message:{include:{messages: {include: {accounts: {include: {roles: true}}}}}}}});
    if(!listen){
        res.status(422).send("Listen does not exists")
        return;
    }
    listen.user_discord_id_encrypted = MessageEncryptService.decrypt(listen.user_discord_id_encrypted);
    listen.main_subject_encrypted = MessageEncryptService.decrypt(listen.main_subject_encrypted);
    if(listen.volunteer_notes_encrypted) listen.volunteer_notes_encrypted = MessageEncryptService.decrypt(listen.volunteer_notes_encrypted);
    if(listen.volunteer_main_observations_encrypted) listen.volunteer_main_observations_encrypted = MessageEncryptService.decrypt(listen.volunteer_main_observations_encrypted);

    listen.listen_message = listen.listen_message.map(lm=>({
        ...lm,
        messages:{
            ...lm.messages,
            content_encrypted: MessageEncryptService.decrypt(lm.messages.content_encrypted),
            discord_message_encrypted: MessageEncryptService.decrypt(lm.messages.discord_message_encrypted)
        }
    }))

    let transcriptContent=`
        <html>
            <head>
                <meta charset="utf-8">
                <title>Transcript de l'écoute ${listen.id}</title>
            </head>
            <body style="font-family: sans-serif;">
                <h1>Transcript de l'écoute ${listen.id}</h1>
                <h3 style="margin:0">Sujet principal: ${decodeURI(listen.main_subject_encrypted)}</h3>
                <h4 style="margin:0">notes du bénévole:</h4>
                <p style="margin:0">${decodeURI(listen.volunteer_notes_encrypted || "Aucune note")}</p>
                <h4 style="margin:0">observations du bénévole:</h4>
                <p style="margin:0">${decodeURI(listen.volunteer_main_observations_encrypted || "Aucune note")}</p>
                <div style="margin-bottom: 1rem;"></div>
                <h3>Messages</h3>
                ${listen.listen_message.map(({messages})=>(`
                    <div style="margin-bottom:.5rem">
                        <b>${messages.accounts.roles.name == "bot" ? "utilisateur" : messages.accounts.name}</b>
                        <br>
                        ${decodeURI(messages.content_encrypted)}
                    </div>
                `)).join("")}
            </body>
        </html>
    `

    res.status(200).send(transcriptContent);
})