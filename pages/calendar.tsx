import { LegacyRef, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcherAuth } from "../src/utils/fetcher";
import { CalendarEvent, CalendarEventWithRolesNeededAndRolesFilled } from '../src/interfaces/calendar';
import FullCalendar, { EventInput, EventSourceInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import AuthenticatedLayout from '../src/layouts/authenticated-layout';
import Modal from '../src/components/modal';
import { useRouter } from "next/router";
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from '@fullcalendar/timegrid';
import { useClickOutside } from "react-click-outside-hook";
import { start } from "repl";
import { getCookie } from "cookies-next";
import session from "../src/interfaces/session";
import internal from "stream";

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
  
  const calendarSwr = useSWR<CalendarEventWithRolesNeededAndRolesFilled[]|null>("/api/calendar", fetcherAuth);

  const calendar: CalendarEventWithRolesNeededAndRolesFilled[] = calendarSwr.data || [];
  const newCalendarItems: CalendarEventWithRolesNeededAndRolesFilled[] = [];

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
  let ses: session | undefined;
  
  useEffect(() => {
    (async()=>{
      await fetch("/api/socket");
      let sesRaw = getCookie("session");
      if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
    })()
  })


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
          dateClick={
            (e)=>{
              setShowModal(true);
              calendarRef.current.getApi().gotoDate(e.dateStr)
            }
          }
        />
      </div>
      <div className={"calendar modal justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none max-h-full pointer-events-none transition-all " + (showModal? "opacity-100 " : "opacity-0")}>
        <div className={"relative w-full max-w-280 h-full md:h-auto max-h-full transform transition-all " + (showModal? "pointer-events-auto translate-y-0" : "translate-y-16")}>
          {/*content*/}
          <div className="border-0 rounded-4 shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none p-8 h-200">
            {/*header*/}
            <div className="flex items-start justify-between rounded-t pb-8">
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
                events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end, extendedProps: {calendar_event: c}, color: "#00000000", borderColor: "#00000000"} as EventInput)) as EventSourceInput}
                eventContent={(event)=> {
                  let calendarEvent: CalendarEventWithRolesNeededAndRolesFilled = event.event.extendedProps.calendar_event
                  let nofill = true;
                  let isRegistered = false;
                  let filled = calendarEvent.calendar_event_role_needed.length == 0;
                  let rolesFill : {role_label: string, role_id: bigint, count: number, needed: number}[] = []
                  for (let roleNeeded of calendarEvent.calendar_event_role_needed){
                    let sameRoleCount = 0;
                    for(let {accounts: {roles}} of calendarEvent.account_calendar_event){
                      if(roles.id == roleNeeded.role_id) sameRoleCount ++;
                    }
                    if(sameRoleCount != 0) nofill = false;
                    rolesFill.push({role_label: roleNeeded.roles.label, role_id: roleNeeded.roles.id, count: sameRoleCount, needed: roleNeeded.number})
                  }
                  let bg: string = "";
                  if(filled){
                    bg = "bg-trefle-green"
                  } else if(!nofill){
                    bg = "bg-amber-500"
                  } else {
                    bg = "bg-red-500"
                  }



                  return (
                    <div className={`h-full w-full p-3 rounded-4 ${bg}`}>
                      <div className={`p-1 h-fit ${bg} bg-opacity-80 rounded-2`}>
                        <div className="font-bold leading-none">
                          Permanence {calendarEvent.id}
                          <br />
                          <small>
                            de {event.event.start?.getHours()}h{event.event.start?.getMinutes()} à {event.event.end?.getHours() ?? ( ( event.event.start?.getHours() || 0 ) + 1 )}h{event.event.end?.getMinutes() ?? event.event.start?.getMinutes()} 
                          </small>
                        </div>
                        {
                          calendarEvent.calendar_event_role_needed.length != 0 ? 
                            <div className="pt-2">
                              Nécessite: 
                              <ul className="list-disc pl-4">
                                {rolesFill.map(rf=><li key={`event_${calendarEvent.id}_requirement_${rf.role_id}`}>{rf.needed}x {rf.role_label} ({rf.count}/{rf.needed})</li>)}
                              </ul>
                            </div>
                          : null
                        }
                        
                        <button className={`btn border-white hover:border-white text-white py-0.5 mt-1 ${bg} hover:bg-white hover:bg-opacity-30`} 
                          onClick={()=> {
                            console.log({calendar_event_id: calendarEvent.id, account_id: ses?.user.id} as any)
                            
                            fetch(`/calendar/register`, {
                              method: 'POST',
                              body: {calendar_event_id: calendarEvent.id, account_id: ses?.user.id} as any
                            });
                            return;
                          }}>Rejoindre</button>
                      </div>
                    </div>
                  )
                }}
                slotEventOverlap={false}
                headerToolbar={
                  {
                    left: 'prev',
                    center: 'title',
                    right: 'next',
                    end:'today, dayGridMonth, timeGridWeek, listWeek'
                  }
                }
                locale="fr"
                eventMouseEnter={ function(calEvent: any){
                  console.log(calEvent)
                }}
                
                />
            </div>
          </div>
        </div>
      </div>
      <div className={"fixed inset-0 z-40 bg-black transition-all " + (showModal? "opacity-25" : "opacity-0 pointer-events-none")} onClick={(_)=>{setShowModal(false)}}></div>
    </AuthenticatedLayout>
  );

  
}