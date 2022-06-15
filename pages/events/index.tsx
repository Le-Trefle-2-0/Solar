import { memo, useContext, useRef, useState } from "react";
import useSWR from "swr";
import FullCalendar, {EventInput, EventSourceInput} from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import { useRouter } from "next/router";
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from '@fullcalendar/timegrid';
import fetcher from "../../src/utils/fetcher";
import { CalendarEventWithRolesNeededAndRolesFilled } from "../../src/interfaces/calendar";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import Modal from "../../src/components/modal";
import moment from "moment";
import getSession from "../../src/utils/get_session";
import { roles } from "@prisma/client";
import EventsForm from "../../src/components/form/events";
import { getRoles } from "../api/roles";
import Nav from "../../src/components/sidebar";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";

interface ServersideProps{
  rolesSSR: roles[]
}

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
export default function calendar({rolesSSR} : ServersideProps){
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CalendarEventWithRolesNeededAndRolesFilled|null>();
  const calendarSwr = useSWR<CalendarEventWithRolesNeededAndRolesFilled[]|null>("/api/events", fetcher);
  const session =  useRef(getSession());
  const activeEventCtx = useContext(ReferenceActualEventContext)

  const calendar: CalendarEventWithRolesNeededAndRolesFilled[] = calendarSwr.data || [];
  const newCalendarItems: CalendarEventWithRolesNeededAndRolesFilled[] = [];

  const calendarRef = useRef<FullCalendar>(new FullCalendar({}));

  for (const calendarItemTemp of calendar){
    let calendarItem = {...calendarItemTemp};
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
  
  return (
    <AuthenticatedLayout>
      <div className="h-full flex flex-col">
        <div className="flex items-center mb-8 justify-between">
          <h2 className="">PLANNING</h2>
          {session.current?.user.is_ref? <button className="btn py-0.5 -my-1" onClick={()=>setSelectedEventForEdit(null)}>Ajouter</button> : ''}
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
          eventClick={
            e=>{
              setShowModal(true);
              calendarRef.current.getApi().gotoDate(e.event.start)
            }
          }
        />
      </div>
      <Modal expand={true} title="S’INSCRIRE A UNE PERMANENCE" isOpened={showModal} onClose={()=>setShowModal(false)}>
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
          events={newCalendarItems.map( c => ({title: c.subject,date: c.date_start,start: c.date_start,end: c.date_end, extendedProps: {calendar_event: calendar.find(oc=>oc.id == c.id)}, color: "#00000000", borderColor: "#00000000", overlap: false} as EventInput)) as EventSourceInput}
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
            let joined = false;
            let filled = true;
            let rolesFill : {role_label: string, role_id: bigint, count: number, needed: number}[] = []
            
            for (let roleNeeded of calendarEvent.calendar_event_role_needed){
              let sameRoleCount = 0;
              for(let {accounts: {roles, id}} of calendarEvent.account_calendar_event){
                if(roles.id == roleNeeded.role_id) sameRoleCount ++;
                if(id == session.current?.user.id) joined = true;
              }
              if(sameRoleCount != 0) nofill = false;
              if(sameRoleCount < roleNeeded.number) filled = false;
              rolesFill.push({role_label: roleNeeded.roles.label, role_id: roleNeeded.roles.id, count: sameRoleCount, needed: roleNeeded.number})
            }
            if(calendarEvent.calendar_event_role_needed.length == 0){
              for(let {accounts: {id}} of calendarEvent.account_calendar_event){
                if(id == session.current?.user.id) joined = true;
              }
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
                  
                  {
                    !session.current?.user.is_bot ?
                      <button className={`btn border-white hover:border-white text-white py-0.5 mt-1 ${bg} hover:bg-white hover:bg-opacity-30`} 
                      onClick={()=> {
                        fetch(`api/events/${calendarEvent.id}/register`, {method: joined ? "DELETE" : "POST"}).then((r)=>{
                          if(r.ok){calendarSwr.mutate();
                          activeEventCtx.update();
                        }});
                      }}>{joined ? "Quitter" : "Rejoindre"}</button>
                    : null
                  }
                  {
                    !session.current?.user.is_bot && session.current?.user.is_ref ? 
                    <>
                      <button className={`btn border-white hover:border-white text-white py-0.5 mt-1 ${bg} hover:bg-white hover:bg-opacity-30`} 
                      onClick={()=> setSelectedEventForEdit(calendarEvent)}>
                        Modifier
                      </button>

                      <button className={`btn border-white hover:border-white text-white py-0.5 mt-1 ${bg} hover:bg-white hover:bg-opacity-30`} 
                      onClick={()=> {
                        if(confirm("Voulez-vous vraiment supprimer cette permanence?")){
                          fetch(`api/events/` + calendarEvent.id, {method: 'DELETE'}).then((r)=>{if(r.ok){calendarSwr.mutate();}});
                        }
                      }}>
                        Supprimer
                      </button>
                    </>
                    : null
                  }
                </div>
                
              </div>
            )
          }}
          />
        </div>
      </Modal>
      <Modal title="Modifier une permanence" isOpened={selectedEventForEdit !== undefined} onClose={()=>setSelectedEventForEdit(undefined)}>
        <div className="p-8">
          <EventsForm key={Math.random()} roles={rolesSSR} event={selectedEventForEdit} onCancel={() => setSelectedEventForEdit(undefined)} onSuccess={() => {setSelectedEventForEdit(undefined); calendarSwr.mutate(); activeEventCtx.update();}}/>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}

export async function getServerSideProps(){
    return {props:{rolesSSR: JSON.parse(JSON.stringify(await getRoles()))} as ServersideProps}
}