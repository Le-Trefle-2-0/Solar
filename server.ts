import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import SocketEvent from "./src/socket/SocketEvent";
import io_data from "./src/utils/io_data";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        socket.onAny((eventName, ...args) => {
            SocketEvent.dispatchEvent(socket, eventName, io_data, ...args);
        });
    });

    httpServer
    .once("error", (err) => {
        console.error(err);
        process.exit(1);
    }).listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});