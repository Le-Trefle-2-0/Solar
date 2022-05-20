import connect from "next-connect";
import checkJWT, { NextApiRequestWithUser } from "../../../../src/middlewares/checkJWT";
import { postSchema } from "../../../../src/schemas/accountCalendarEvent";
import prisma_instance from "../../../../src/utils/prisma_instance";
import { accounts } from "@prisma/client";
import checkSchema from "../../../../src/middlewares/checkSchema";

export function getAccountCalendarEvent() {
  return prisma_instance.account_calendar_event.findMany().then((v)=>{
    return v;
  });
}

export default connect()
.post(checkJWT, async (req: NextApiRequestWithUser, res) => {
  const calendar_event = await prisma_instance.calendar_events.findFirst({where: { id: parseInt(req.query.id as string) }});
  if(calendar_event == null){
      res.status(422).send('Event does not exist'); return;
  }
  await prisma_instance.account_calendar_event.create({data: {
    account_id: req.session.user.id,
    calendar_event_id: calendar_event.id
  }});
  res.status(201).send(req.body);
})
.delete(checkJWT, async (req: NextApiRequestWithUser, res) => {
  const calendar_event = await prisma_instance.calendar_events.findFirst({where: { id: parseInt(req.query.id as string) }});
  if(calendar_event == null){
      res.status(422).send('Event does not exist'); return;
  }
  await prisma_instance.account_calendar_event.delete({where: {
    account_id_calendar_event_id: {
      account_id: req.session.user.id,
      calendar_event_id: calendar_event.id
    }
  }});
  res.status(201).send(req.body);
})
