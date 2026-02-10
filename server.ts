import express from "express";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { logger } from "./lib/logger";

declare global {
    namespace Express {
        interface Request {
            io?: Server;
        }
    }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

declare global {
    var io: Server;
}

app.prepare().then(async () => {
    const server = express();
    const httpServer = createServer(server);

    const io = new Server(httpServer, {
        // cors: { origin: "*" } 
    });

    global.io = io;

    // Handle all other routes with Next.js
    server.all("*all", (req: express.Request, res: express.Response) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    io.on("connection", (socket) => {
        logger.info(`Client connected: ${socket.id}`);

        socket.on("join_room", (roomId: string) => {
            socket.join(roomId);
            logger.info(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on("send_message", (data: any) => {
            // Simplified logging to avoid potential parsing issues with object literals in some environments
            logger.info(`Message received in room ${data.roomId} from ${data.senderId}`);
            io.to(data.roomId).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    httpServer.listen(port, () => {
        logger.info(`> Ready on http://${hostname}:${port}`);
    });
});
