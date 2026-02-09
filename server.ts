import express from "express";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
// import { createAdapter } from "@socket.io/redis-adapter";
// import { createClient } from "redis";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    const server = express();
    const httpServer = createServer(server);

    const io = new Server(httpServer, {
        // cors: { origin: "*" } 
    });

    /*
    // Redis Setup
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    */

    // Handle all other routes with Next.js
    server.use((req: express.Request, res: express.Response) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join_room", (roomId: string) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on("send_message", (data: any) => {
            console.log("Message received:", data);
            io.to(data.roomId).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
