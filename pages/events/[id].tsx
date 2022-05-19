import useSWR from "swr";
import { fetcherAuth } from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import 'emoji-mart/css/emoji-mart.css'
import EventsForm from "../../src/components/form/events";
import { roles } from "@prisma/client";
import { ListenWithStatus } from "../../src/interfaces/listens";
import { CalendarEventWithRolesNeededAndRolesFilled } from "../../src/interfaces/calendar";

interface ServersideProps{
    rolesSSR: roles[]
}

export default function Event({rolesSSR}: ServersideProps){
  const router = useRouter();
  const eventSwr = useSWR<CalendarEventWithRolesNeededAndRolesFilled|null>(router.query.id?`/api/events/${router.query.id}`:null, fetcherAuth);
  const event = eventSwr.data || undefined;

  return (
    <AuthenticatedLayout>
        <EventsForm roles={rolesSSR} event={event}></EventsForm>
    </AuthenticatedLayout>
  );
}