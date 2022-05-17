import connect from "next-connect";
import { CalendarEventWithRolesNeededAndRolesFilled } from "../../../src/interfaces/calendar";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import checkSchema from "../../../src/middlewares/checkSchema";
 import { postSchema } from "../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";


export async function getCalendar() {
  return await prisma_instance.calendar_events.findMany({
    include:{
      account_calendar_event: {select: {
        accounts: {
          select: {
            roles: true
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

export default connect().get(checkJWT, async (req, res) => {
  res.status(200).send(await getCalendar());
})
.post(checkJWT, checkSchema({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
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

  const calendar_events = await prisma_instance.calendar_events.create({data: req.body});

  if (needed_roles != null){
    for(const needed_roles_data of needed_roles){
      await prisma_instance.calendar_event_role_needed.create({data: {role_id: needed_roles_data.role_id, number: needed_roles_data.number, calendar_event_id: calendar_events.id} as any});
    }
  }
  
  res.status(201).send(req.body);
})
