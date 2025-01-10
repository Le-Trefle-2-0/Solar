import { CalendarEventWithRolesNeededAndRolesFilled } from "../../../src/interfaces/calendar";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import checkSchema from "../../../src/middlewares/checkSchema";
import { postSchema } from "../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";

import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter, expressWrapper } from "next-connect";
import cors from "cors";

const router = createRouter<NextApiRequestWithUser, NextApiResponse>();

export async function getCalendar() {
  return await prisma_instance.calendar_events.findMany({
    include:{
      account_calendar_event: {select: {
        accounts: {
          select: {
            roles: true,
            id: true
          }
        }
      }},
      calendar_event_role_needed: {
        include: {
          roles: true
        }
      }
    }
  }) as CalendarEventWithRolesNeededAndRolesFilled[];
}

router.use(expressWrapper(checkJWT)).get(async (req, res) => {
  res.status(200).send(await getCalendar());
})
.post(async (req, res) => {
  // if(!req.session.user.json.is_ref && !req.session.user.json.is_admin && !req.session.user.json.is_bot) {
  //     res.status(403).send("forbidden")
  //     return;
  // }
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
  
  req.body.type_id = 1;

  const calendar_events = await prisma_instance.calendar_events.create({data: req.body});

  if (needed_roles != null){
    for(const needed_roles_data of needed_roles){
      await prisma_instance.calendar_event_role_needed.create({data: {role_id: needed_roles_data.role_id, number: needed_roles_data.number, calendar_event_id: calendar_events.id} as any});
    }
  }
  
  res.status(201).send(req.body);
});

export default router.handler({
    onError: (err: any, req, res) => {
        console.error(err.stack);
        res.status(err.statusCode || 500).end(err.message);
    },
});