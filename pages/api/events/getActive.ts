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
    todayDate.setMilliseconds(0);
    let yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    //request apparently not supporting timezones 
    /*
    let ev = await prisma_instance.calendar_events.findFirst({
        where:{
        account_calendar_event:{
            some:{
                accounts:{
                    id: user_id
                }
            }
        },
        date_start: {lte: todayDate.toISOString()},
        daily_time_start: {lte: todayHour.toISOString()},
        OR:[
            {date_start: {gte: yesterdayDate.toISOString()}},
            {date_end: {gte: todayDate.toISOString()}}
        ],
        daily_time_end: {gte: todayHour.toISOString()},
        }
    });
    */
    let query = `
        SELECT 
            \`solar\`.\`calendar_events\`.\`id\`,
            \`solar\`.\`calendar_events\`.\`subject\`, 
            \`solar\`.\`calendar_events\`.\`date_start\`, 
            \`solar\`.\`calendar_events\`.\`date_end\`, 
            \`solar\`.\`calendar_events\`.\`daily_time_start\`, 
            \`solar\`.\`calendar_events\`.\`daily_time_end\`, 
            \`solar\`.\`calendar_events\`.\`creator_id\` 
        FROM \`solar\`.\`calendar_events\` 
        WHERE ((\`solar\`.\`calendar_events\`.\`id\`) IN (
            SELECT \`t0\`.\`id\` 
            FROM \`solar\`.\`calendar_events\`AS \`t0\` 
            INNER JOIN \`solar\`.\`account_calendar_event\` AS \`j0\` ON (\`j0\`.\`calendar_event_id\`) = (\`t0\`.\`id\`) 
            WHERE ((\`j0\`.\`account_id\`,\`j0\`.\`calendar_event_id\`) IN (
                SELECT \`t1\`.\`account_id\`, \`t1\`.\`calendar_event_id\` 
                FROM \`solar\`.\`account_calendar_event\` AS \`t1\` 
                INNER JOIN \`solar\`.\`accounts\` AS \`j1\` ON (\`j1\`.\`id\`) = (\`t1\`.\`account_id\`)
                WHERE (\`j1\`.\`id\` = ${user_id} AND \`t1\`.\`account_id\` IS NOT NULL AND \`t1\`.\`calendar_event_id\` IS NOT NULL)) AND \`t0\`.\`id\` IS NOT NULL)
            ) 
            AND \`solar\`.\`calendar_events\`.\`date_start\` <= "${todayDate.toISOString()}" 
            AND \`solar\`.\`calendar_events\`.\`daily_time_start\` <= "${todayHour.getHours()}:${todayHour.getMinutes()}" 
            AND (\`solar\`.\`calendar_events\`.\`date_start\` >= "${yesterdayDate.toISOString()}" 
                OR \`solar\`.\`calendar_events\`.\`date_end\` >= "${todayDate.toISOString()}") 
            AND \`solar\`.\`calendar_events\`.\`daily_time_end\` >= "${todayHour.getHours()}:${todayHour.getMinutes()}") 
            LIMIT 1 OFFSET 0
    `;
    let ev: any = await prisma_instance.$queryRawUnsafe(query)
    return ev[0] || null;
}

export default connect().get(checkJWT, async (req, res) => {
  res.status(200).send(await getActiveEvent(req.session.user.id));
})
