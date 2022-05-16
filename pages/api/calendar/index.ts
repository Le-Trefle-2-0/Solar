import connect from "next-connect";
import { CalendarEventWithRolesNeededAndRolesFilled } from "../../../src/interfaces/calendar";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import validator from "../../../src/middlewares/validator";
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
.post(checkJWT, validator({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
  req.body.date_start = new Date(req.body.date_start);
  if(req.body.date_end){
    req.body.date_end = new Date(req.body.date_end);
  }
  req.body.daily_time_start = new Date(req.body.daily_time_start);
  req.body.daily_time_end = new Date(req.body.daily_time_end);
  
  await prisma_instance.calendar_events.create({data: req.body});
  res.status(201).send(req.body);
})
