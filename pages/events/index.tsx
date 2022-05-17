import { LegacyRef, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import FullCalendar, {EventInput, EventSourceInput} from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import { useRouter } from "next/router";
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from '@fullcalendar/timegrid';
import { useClickOutside } from "react-click-outside-hook";
import { start } from "repl";
import { fetcherAuth } from "../../src/utils/fetcher";
import { CalendarEvent, CalendarEventWithRolesNeededAndRolesFilled } from "../../src/interfaces/calendar";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import Modal from "../../src/components/modal";
import session from "../../src/interfaces/session";
import { getCookie } from "cookies-next";
import moment from "moment";

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
  const calendarSwr = useSWR<CalendarEventWithRolesNeededAndRolesFilled[]|null>("/api/events", fetcherAuth);

  const calendar: CalendarEventWithRolesNeededAndRolesFilled[] = calendarSwr.data || [];
  const newCalendarItems: CalendarEventWithRolesNeededAndRolesFilled[] = [];

  const calendarRef = useRef<FullCalendar>(new FullCalendar({}));

  for (const calendarItem of calendar){
    let dateStart = moment(calendarItem.date_start).toDate();
    dateStart = setHour(dateStart, moment((calendarItem.daily_time_start as any).replace("Z",""), "YYYY-MM-DDTHH:mm:ss.SSS", true).toDate());
    if(calendarItem.date_end == null){
      let dateEnd = new Date(calendarItem.date_start);
      dateEnd = setHour(dateEnd, moment((calendarItem.daily_time_end as any).replace("Z",""), "YYYY-MM-DDTHH:mm:ss.SSS", true).toDate());
      newCalendarItems.push({...calendarItem, date_start: dateStart, date_end: dateEnd,});
      continue;
    }
    let dateEnd = new Date(calendarItem.date_end);
    dateEnd = setHour(dateEnd, moment((calendarItem.daily_time_end as any).replace("Z",""), "YYYY-MM-DDTHH:mm:ss.SSS", true).toDate());
    for(let i=0; i<=Math.floor((dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24)); i++){
      newCalendarItems.push({...calendarItem, date_start: addDays(dateStart, i), date_end: setHour(addDays(dateStart, i), dateEnd)})
    }
  }

  const router = useRouter();
  let ses: session | undefined;
  
  useEffect(() => {
    (async()=>{
      let sesRaw = getCookie("session");
      if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
    })()
  })
  

  return (
    <AuthenticatedLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center mb-8 justify-between">
          <h2 className="">PLANNING</h2>
          <button className="btn py-0.5 -my-1" onClick={()=>router.push(`/events/add`)}>Ajouter</button>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end} as EventInput)) as EventSourceInput}
          contentHeight={"100%"}
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
      <Modal title="S’INSCRIRE A UNE PERMANENCE" isOpened={showModal} onClose={()=>setShowModal(false)}>
        <div className="p-8 h-full">
        <FullCalendar
          ref={calendarRef}
          height={"100%"}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          allDaySlot={false}
          eventOverlap={false}
          selectOverlap={false}
          slotEventOverlap={false}
          events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end, extendedProps: {calendar_event: c}, color: "#00000000", borderColor: "#00000000", overlap: false} as EventInput)) as EventSourceInput}
          headerToolbar={
            {
              left: 'prev',
              center: 'title',
              right: 'next',
              end:'today, dayGridMonth, timeGridWeek, listWeek'
            }
          }
          locale="fr"
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
              <div className={`h-full w-full p-2 rounded-4 ${bg}`}>
                <div className={`p-1 h-fit ${bg} bg-opacity-80 rounded-2`}>
                  <div className="font-bold leading-none">
                    Permanence {calendarEvent.id} ({calendarEvent.subject})
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
                      
                      fetch(`/events/register`, {
                        method: 'POST',
                        body: {calendar_event_id: calendarEvent.id, account_id: ses?.user.id} as any
                      });
                      return;
                    }}>Rejoindre</button>
                </div>
              </div>
            )
          }}
          />
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}