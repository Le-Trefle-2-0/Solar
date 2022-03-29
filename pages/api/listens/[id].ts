import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import Joi from "joi";
import validator from "../../../src/middlewares/validator";
import { filterSchema, putSchema } from "../../../src/schemas/listensSchemas";

export default connect().get(checkJWT, validator({query: filterSchema}), async (req, res) => {
    const prisma = new PrismaClient();
    let filter = {
        id: parseInt(req.query.id as string),
        NOT: {
            listen_status: {
                name: req.query.not_done ? "commented" : ""
            }
        }
    } as Prisma.listensWhereInput;
    res.status(200).send(await prisma.listens.findFirst({
        where: filter
    }));
    prisma.$disconnect();
})
.put(checkJWT, validator({body: putSchema}), async (req, res) => {
    const prisma = new PrismaClient();
    await prisma.listens.update({
        where: {
            id: parseInt(req.query.id as string)
        },
        data: req.body
    });
    res.status(204).send(req.body);
    prisma.$disconnect();
})
.delete(checkJWT, async (req, res) => {
    const prisma = new PrismaClient();
    await prisma.listens.delete({
        where: {
            id: parseInt(req.query.id as string)
        }
    })
    res.status(204).send(req.body);
    prisma.$disconnect();
})
