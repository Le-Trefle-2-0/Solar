import { LegacyRef, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcherAuth } from "../src/utils/fetcher";
import { CalendarEvent } from '../src/interfaces/calendar';
import FullCalendar, { EventInput, EventSourceInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import AuthenticatedLayout from '../src/layouts/authenticated-layout';
import Modal from '../src/components/modal';
import { useRouter } from "next/router";
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from '@fullcalendar/timegrid';
import { useClickOutside } from "react-click-outside-hook";
import { start } from "repl";

function addDays(date: Date, days: number) {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function setHour(date: Date, other: Date) {
  date.setHours(other.getHours());
  date.setMinutes(other.getMinutes());
  return date;
}
export default function calendar(){
  const [value, onChange] = useState(new Date());
  const [showModal, setShowModal] = useState<boolean>(false)
  const calendarSwr = useSWR<CalendarEvent[]|null>("/api/calendar", fetcherAuth);

  const calendar: CalendarEvent[] = calendarSwr.data || [];
  const newCalendarItems: CalendarEvent[] = [];

  const calendarRef = useRef<FullCalendar>(new FullCalendar({}));

  for (const calendarItem of calendar){
    let dateStart = new Date(calendarItem.date_start);
    dateStart = setHour(dateStart, new Date(calendarItem.daily_time_start));
    if(calendarItem.date_end == null){
      let dateEnd = new Date(calendarItem.date_start);
      dateEnd = setHour(dateEnd, new Date(calendarItem.daily_time_start));
      newCalendarItems.push({...calendarItem, date_start: dateStart, date_end: dateEnd,});
      continue;
    }
    let dateEnd = new Date(calendarItem.date_end);
    dateEnd = setHour(dateEnd, new Date(calendarItem.daily_time_end));
    for(let i=0; i<=Math.floor((dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24)); i++){
      newCalendarItems.push({...calendarItem, date_start: addDays(dateStart, i), date_end: setHour(addDays(dateStart, i), dateEnd)})
    }
  }

  const router = useRouter();
  

  return (
    <AuthenticatedLayout>
      <div>
        <h2 className="mb-8">PLANNING</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end} as EventInput)) as EventSourceInput}
          contentHeight={"40rem"}
          headerToolbar={
            {
              left: 'prev',
              center: 'title',
              right: 'next',
              end:'today, dayGridMonth, timeGridWeek, listWeek'
            }
          }
          locale="fr"
          // eventClick={
          //   (e)=>{
          //     e.jsEvent.preventDefault();
          //     console.log(e.event.url);
          //     let data = fetcherAuth<CalendarEvent>(e.event.url)
          //     .then(
          //       (res) => {
          //         console.log(res)
          //         setShowModal(res);
          //       });
          //   }
          // }
          dateClick={
            (e)=>{
              setShowModal(true);
              calendarRef.current.getApi().gotoDate(e.dateStr)
            }
          }
        />
      </div>
      <div className={"calendar modal justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none max-h-full pointer-events-none transition-all " + (showModal? "opacity-100 " : "opacity-0")}>
        <div className={"relative w-full max-w-2xl h-full md:h-auto max-h-full transform transition-all " + (showModal? "pointer-events-auto translate-y-0" : "translate-y-16")}>
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none m-4 h-200">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
              <h3 className="text-1xl font-semibold text-trefle-soft-black">
                S’INSCRIRE A UNE PERMANENCE
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-trefle-soft-black float-right text-3xl leading-3 font-semibold outline-none focus:outline-none"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            {/*body*/}
            <div className="relative flex-auto">
              <FullCalendar
                ref={calendarRef}
                height={"100%"}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                allDaySlot={false}
                events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end} as EventInput)) as EventSourceInput}
                headerToolbar={
                  {
                    left: 'prev',
                    center: 'title',
                    right: 'next',
                    end:'today, dayGridMonth, timeGridWeek, listWeek'
                  }
                }
                locale="fr"
                />
            </div>
          </div>
        </div>
      </div>
      <div className={"fixed inset-0 z-40 bg-black transition-all " + (showModal? "opacity-25" : "opacity-0 pointer-events-none")} onClick={(_)=>{setShowModal(false)}}></div>
    </AuthenticatedLayout>
  );

  
}