import connect from "next-connect";
import checkJWT from "../../../../src/middlewares/checkJWT";
import {Prisma, PrismaClient} from "@prisma/client";
import { putSchema } from "../../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../../src/utils/prisma_instance";
import checkSchema from "../../../../src/middlewares/checkSchema";

export default connect().get(checkJWT, async (req, res) => {
    let filter = {
        id: parseInt(req.query.id as string)
    }
        
    res.status(200).send(await prisma_instance.calendar_events.findFirst({
        where: filter
    }));
})
.put(checkJWT, checkSchema({body: putSchema}), async (req, res) => {
    if(!req.session.user.is_ref) {
        res.status(403).send("forbidden")
        return;
    }
    req.body.date_start = new Date(req.body.date_start);
    if(req.body.date_end){
      req.body.date_end = new Date(req.body.date_end);
    }
    req.body.daily_time_start = new Date(req.body.daily_time_start);
    req.body.daily_time_end = new Date(req.body.daily_time_end);
    req.body.creator_id = req.body.creator_id ?? req.session.user.id;
    
    let needed_roles: any = null;
    if(req.body.needed_roles){
      needed_roles = req.body.needed_roles;
      delete req.body.needed_roles;
    }
  
    const calendar_events = await prisma_instance.calendar_events.update({data: req.body, where:{id: parseInt(req.query.id as string)}});
  
    await prisma_instance.calendar_event_role_needed.deleteMany({
        where: { calendar_event_id: calendar_events.id }
    })
    if (needed_roles != null){
      for(const needed_roles_data of needed_roles){
        await prisma_instance.calendar_event_role_needed.create({
            data: {role_id: needed_roles_data.role_id, number: needed_roles_data.number, calendar_event_id: calendar_events.id} as any
        });
      }
    }
    
    res.status(204).send(req.body);
})
.delete(checkJWT, async (req, res) => {
    if(!req.session.user.is_ref) {
        res.status(403).send("forbidden")
        return;
    }
    let messages = await prisma_instance.calendar_event_message.findMany({
        where: {
            calendar_event_id: parseInt(req.query.id as string)
        }
    })
    await prisma_instance.calendar_event_message.deleteMany({
        where: {
            calendar_event_id: parseInt(req.query.id as string)
        }
    })
    await prisma_instance.event_messages.deleteMany({
        where: {
            id: {
                in: messages.map(m=>m.event_message_id)
            }
        }
    })
    await prisma_instance.calendar_event_role_needed.deleteMany({
        where: {
            calendar_event_id: parseInt(req.query.id as string)
        }
    })
    await prisma_instance.account_calendar_event.deleteMany({
        where: {
            calendar_event_id: parseInt(req.query.id as string)
        }
    })
    await prisma_instance.calendar_events.delete({
        where: {
            id: parseInt(req.query.id as string)
        }
    })
    res.status(204).send(req.body);
})
