import connect from "next-connect";
import { CalendarEventWithRolesNeededAndRolesFilled } from "../../../src/interfaces/calendar";
import checkJWT, { NextApiRequestWithUser } from "../../../src/middlewares/checkJWT";
import checkSchema from "../../../src/middlewares/checkSchema";
 import { postSchema } from "../../../src/schemas/calendarSchemas";
import prisma_instance from "../../../src/utils/prisma_instance";


export async function getActiveEvent(user_id: bigint) {
    let todayDate = new Date();
    let hourTimeStamp = todayDate.getHours() * 60 * 60 * 1000 + todayDate.getMinutes() * 60 * 1000;
    let todayHour = new Date(hourTimeStamp)
    todayDate.setHours(- todayDate.getTimezoneOffset() / 60);
    todayDate.setMinutes(0);
    todayDate.setSeconds(0);
    todayDate.setMilliseconds(1);
    let yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    return await prisma_instance.calendar_events.findFirst({
        where:{
        account_calendar_event:{
            some:{
            accounts:{
                id: user_id
            }
            }
        },
        date_start: {lte: todayDate},
        daily_time_start: {lte: todayHour},
        OR:[
            {date_start: {gte: yesterdayDate}},
            {date_end: {gte: todayDate}}
        ],
        daily_time_end: {gte: todayHour},
        }
    })
}

export default connect().get(checkJWT, async (req, res) => {
  res.status(200).send(await getActiveEvent(req.session.user.id));
})
