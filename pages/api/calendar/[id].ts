import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import Joi from "joi";
import validator from "../../../src/middlewares/validator";
import { putSchema } from "../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";

export default connect().get(checkJWT, async (req, res) => {
    let filter = {
        id: parseInt(req.query.id as string)
    }
        
    res.status(200).send(await prisma_instance.calendar_events.findFirst({
        where: filter
    }));
})
.put(checkJWT, validator({body: putSchema}), async (req, res) => {
    await prisma_instance.calendar_events.update({
        where: {
            id: parseInt(req.query.id as string)
        },
        data: req.body
    });
    res.status(204).send(req.body);
})
.delete(checkJWT, async (req, res) => {
    await prisma_instance.calendar_events.delete({
        where: {
            id: parseInt(req.query.id as string)
        }
    })
    res.status(204).send(req.body);
})
