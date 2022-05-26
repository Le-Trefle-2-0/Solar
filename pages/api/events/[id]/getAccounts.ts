import connect from "next-connect";
import checkJWT from "../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { putSchema } from "../../../../src/schemas/calendarSchemas";
import prisma_instance, {exclude} from "../../../../src/utils/prisma_instance";
import checkSchema from "../../../../src/middlewares/checkSchema";

export default connect().get(checkJWT, async (req, res) => {      
    let filter = 
    req.query.role_names? {
        roles:{
            name: { in: req.query.role_names}
        }
    } : {}

    res.status(200).send((await prisma_instance.accounts.findMany({
        where: {
            account_calendar_event:{
                some:{
                    calendar_event_id: parseInt(req.query.id as string),
                }
            },
            ...filter
        },
        include:{
            roles: true,
        }
    })).map(acc=>exclude(acc, "password")));
})