import { LegacyRef, useEffect, useState } from "react";
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

export default function calendar(){
  const [value, onChange] = useState(new Date());
  const [showModal, setShowModal] = useState<string|false>(false)
  const calendarSwr = useSWR<CalendarEvent[]|null>("/api/calendar", fetcherAuth);
  const calendar: CalendarEvent[] = calendarSwr.data || [];
  const router = useRouter();
  const [modalRef, hasClickedOutsideModal] = useClickOutside();
  

  //onClickOutside(() => setShowModal(false));
  useEffect(()=>{
    if(hasClickedOutsideModal){
      setShowModal(false)
    }
  }, [hasClickedOutsideModal]);
  
  return (
    <AuthenticatedLayout>
      <div>
        <h2 className="mb-8">PLANNING</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendar.map( c => ({title: c.subject, date: c.date_start/*, url: '/api/calendar/' + c.id*/} as EventInput)) as EventSourceInput}
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
              setShowModal(e.dateStr);
            }
          }
        />
      </div>
      {showModal?(
      <>
      <div ref={modalRef as LegacyRef<HTMLDivElement>} className="calendar modal justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
              <h3 className="text-1xl font-semibold">
              S’INSCRIRE A UNE PERMANENCE
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setShowModal(false)}
              >
                <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div className="relative flex-auto">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                initialDate={showModal}
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
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
      ) : null}
    </AuthenticatedLayout>
  );

  
}