import connect from "next-connect";
import checkJWT from "../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { filterSchema, putSchema } from "../../../../src/schemas/listensSchemas";
import prisma_instance from "../../../../src/utils/prisma_instance";
import checkSchema from "../../../../src/middlewares/checkSchema";
import MessageEncryptService from './../../../../src/utils/message_encrypt_service';

export default connect().get(checkJWT, checkSchema({query: filterSchema}), async (req, res) => {
    let filter = {
        id: parseInt(req.query.id as string),
        NOT: {
            listen_status: {
                name: req.query.not_done ? "commented" : ""
            }
        }
    } as Prisma.listensWhereInput;
    res.status(200).send(await prisma_instance.listens.findFirst({
        where: filter,
        include: req.query.with_users ? { account_listen: { include: { accounts: true } }, listen_status: true } : { listen_status: true}
    }));
})
.put(checkJWT, checkSchema({body: putSchema}), async (req, res) => {
    let additionnalValues = {} as any;
    if(req.body.volunteer_notes_encrypted || req.body.volunteer_main_observations_encrypted){
        additionnalValues.listen_status = {
            connect:{
                name:"commented"
            }
        }
    }
    if(req.body.volunteer_notes_encrypted) additionnalValues.volunteer_notes_encrypted = MessageEncryptService.encrypt(req.body.volunteer_notes_encrypted);
    if(req.body.volunteer_main_observations_encrypted) additionnalValues.volunteer_main_observations_encrypted = MessageEncryptService.encrypt(req.body.volunteer_main_observations_encrypted);
    await prisma_instance.listens.update({
        where: {
            id: parseInt(req.query.id as string)
        },
        data: {
            ...req.body,
            ...additionnalValues
        }
    });
    console.log(req.body)
    res.status(204).end();
})
