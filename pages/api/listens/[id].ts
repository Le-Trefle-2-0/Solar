import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { filterSchema, putSchema } from "../../../src/schemas/listensSchemas";
import PrismaInstance from "../../../src/utils/prisma_instance";
import prisma_instance from "../../../src/utils/prisma_instance";
import { setQuery } from "../../../src/utils/helper";
import checkSchema from "../../../src/middlewares/checkSchema";

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
    await prisma_instance.listens.update({
        where: {
            id: parseInt(req.query.id as string)
        },
        data: req.body
    });
    res.status(204).send(req.body);
})
.delete(checkJWT, async (req, res) => {
    await prisma_instance.listens.delete({
        where: {
            id: parseInt(req.query.id as string)
        }
    })
    res.status(204).send(req.body);
})
