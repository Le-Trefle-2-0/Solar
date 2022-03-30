import React, { useState } from 'react';
import useSWR from "swr";
import { fetcherAuth } from "../src/utils/fetcher";
import { CalendarEvent } from '../src/interfaces/calendar';
import FullCalendar, { EventInput, EventSourceInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'

export default function calendar(){
  const [value, onChange] = useState(new Date());
  const calendarSwr = useSWR<CalendarEvent[]|null>("/api/calendar", fetcherAuth);
  const calendar: CalendarEvent[] = calendarSwr.data || [];


  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={calendar.map( c => ({title: c.subject, date: c.date_start } as EventInput)) as EventSourceInput}
    />
  );

//   return (
//     <AuthenticatedLayout>
//     <div>
//       <Calendar 
//       onChange={onChange} 
//       value={value}
//       tileContent={({ date }: any) => {
//         date = moment(date).format("YYYY-MM-DD HH:mm:ss")
//         let tileContent = ' ';
//         calendar.map((c: calendar_events) => {
//             date = moment(date).format("YYYY-MM-DD HH:mm:ss")
//             let date_start = moment(c.date_start).format("YYYY-MM-DD HH:mm:ss");
//             let date_end = c.date_end ? moment(c.date_end).format("YYYY-MM-DD HH:mm:ss") : null;

//             if(date_start > date && (!date_end || date_end < date)){
//                 tileContent += c.creator_id + ' ';
//             }
//         })
//         return tileContent;
//     }}
//       />
//     </div>
//     </AuthenticatedLayout>
//   );
}