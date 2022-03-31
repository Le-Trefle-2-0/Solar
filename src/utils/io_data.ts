import { IoData } from "../../pages/api/socket";

declare global {
  namespace NodeJS {
    interface Global {
        io_data: IoData;
    }
  }
}

let io_data: IoData;

if (!global.io_data) {
    console.log("[INFO] generating new Prisma instance")
    global.io_data = {eventSessions: [], listenSessions: []};
}

io_data = global.io_data;

export default io_data;