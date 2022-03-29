import { listens, listen_status } from "@prisma/client";

export type ListenWithStatus = listens & { listen_status: listen_status };