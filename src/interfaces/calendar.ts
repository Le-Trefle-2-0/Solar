import { calendar_events, calendar_event_role_needed, roles } from "@prisma/client";

export type CalendarEvent = calendar_events;
export type CalendarEventWithRolesNeededAndRolesFilled = calendar_events & {account_calendar_event:{accounts:{roles: roles, id: number | bigint, name: string}}[], calendar_event_role_needed: (calendar_event_role_needed & {roles: roles})[]};