import connect from "next-connect";
import checkJWT from "../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { putSchema } from "../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";
import checkSchema from "../../../src/middlewares/checkSchema";

export default connect().get(checkJWT, async (req, res) => {
    let filter = {
        id: parseInt(req.query.id as string)
    }
        
    res.status(200).send(await prisma_instance.calendar_events.findFirst({
        where: filter
    }));
})
.put(checkJWT, checkSchema({body: putSchema}), async (req, res) => {

    let allDateBody = [
        'date_start',
        'date_end',
        'daily_time_start',
        'daily_time_end'
    ];

    for(const dateBody of allDateBody){
        if(req.body[dateBody])
            req.body[dateBody] = new Date(req.body[dateBody]);
    }
   
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
