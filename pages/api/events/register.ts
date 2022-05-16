import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
 import { postSchema } from "../../../src/schemas/accountCalendarEvent";
import prisma_instance from "../../../src/utils/prisma_instance";
import { CalendarEvent } from '../../../src/interfaces/calendar';
import { accounts } from "@prisma/client";
import checkSchema from "../../../src/middlewares/checkSchema";

export function getAccountCalendarEvent() {
  return prisma_instance.account_calendar_event.findMany().then((v)=>{
    return v;
  });
}

export type account = accounts;

/* export function verifyCalendar(calendar_event: CalendarEvent, account: account) {
  const date_start = calendar_event.daily_time_start;
  const date_end = calendar_event.daily_time_end;
  const account_id = account.id;

  const calendar_events_date = prisma_instance.account_calendar_event.deleteMany({
    where: {
      account_id: account_id
    }
  });
} */

export default connect()
.post(checkJWT, checkSchema({body: postSchema}), async (req: NextApiRequestWithUser, res) => {
    const calendar_event = prisma_instance.calendar_events.findFirst({where: { id: req.body.calendar_event_id }});
    const account = prisma_instance.accounts.findFirst({where: { id: req.body.account_id}});
    

    if(calendar_event == null || account == null){
        res.status(401).send('Event does not exist');
    }
  await prisma_instance.account_calendar_event.create({data: req.body});
  res.status(201).send(req.body);
})
