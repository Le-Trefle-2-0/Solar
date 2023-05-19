import connect from "next-connect";
import checkJWT from "../../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { filterSchema, putSchema } from "../../../../../src/schemas/listensSchemas";
import prisma_instance from "../../../../../src/utils/prisma_instance";
import checkSchema from "../../../../../src/middlewares/checkSchema";
import MessageEncryptService from '../../../../../src/utils/message_encrypt_service';

export default connect().get(checkJWT, async (req, res) => {
    let listens = await prisma_instance.listens.findMany({ where: { user_discord_id_encrypted: req.query.discordID.toString() }});
    let listen = listens[listens.length - 1];
    if (listen) {
        console.log(listen)
        res.status(200).send(listen)
    }
    else res.status(200).send(null)
});
