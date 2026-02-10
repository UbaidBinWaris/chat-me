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

    // Track online users: userId -> Set<socketId>
    const onlineUsers = new Map<string, Set<string>>();

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId as string;

        if (userId) {
            logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

            // Add to online users
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
                // Broadcast that user is online
                io.emit("user_status", { userId, status: "online" });
            }
            onlineUsers.get(userId)?.add(socket.id);

            // Send current online users to the new client
            const onlineUserIds = Array.from(onlineUsers.keys());
            socket.emit("online_users", onlineUserIds);
        } else {
            logger.info(`Client connected without userId: ${socket.id}`);
        }

        socket.on("join_room", (roomId: string) => {
            socket.join(roomId);
            logger.info(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on("send_message", (data: any) => {
            // Simplified logging
            logger.info(`Message received in room ${data.roomId} from ${data.senderId}`);
            io.to(data.roomId).emit("receive_message", data);
        });

        socket.on("delete_message", (data: { messageId: string, roomId: string }) => {
            io.to(data.roomId).emit("message_deleted", data.messageId);
        });

        // Handle read receipt event
        socket.on("mark_read", (data: { roomId: string, userId: string }) => {
            // In a real production app, we might want to broadcast this to other devices of the same user
            // or even to other users in the room to show "Seen by X"
        });

        socket.on("disconnect", () => {
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets?.delete(socket.id);

                if (userSockets?.size === 0) {
                    onlineUsers.delete(userId);
                    // Broadcast that user is offline
                    io.emit("user_status", { userId, status: "offline" });
                    logger.info(`User disconnected: ${userId}`);
                }
            } else {
                logger.info(`Client disconnected: ${socket.id}`);
            }
        });
    });

    httpServer.listen(port, () => {
        logger.info(`> Ready on http://${hostname}:${port}`);
    });
});
