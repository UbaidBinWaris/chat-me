import express from "express";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { getToken } from "next-auth/jwt";
import { prisma } from "./lib/prisma";
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


    // Authentication Middleware
    io.use(async (socket, next) => {
        try {
            // Check for token in handshake auth (sent from client) OR cookies
            // We prioritize the token sent explicitly in the auth object from the client
            const token = socket.handshake.auth.token;

            // If token is a session object (as passed from useSocket), valid logic depends on structure
            // But relying on cookie extraction via getToken is safer if cookies are present
            // However, useSocket passes the whole session object in `auth.token`

            // Standard approach: Use cookie-based auth if same-domain
            const sessionData = await getToken({
                req: socket.request as any,
                secret: process.env.NEXTAUTH_SECRET
            });

            if (sessionData && sessionData.sub) {
                socket.data.userId = sessionData.sub;
                return next();
            }

            return next(new Error("Unauthorized"));
        } catch (err) {
            console.error("Socket auth error:", err);
            return next(new Error("Authentication error"));
        }
    });

    // Track online users: userId -> Set<socketId>
    const onlineUsers = new Map<string, Set<string>>();

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

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

        socket.on("join_room", async (roomId: string) => {
            try {
                // Verify user is a participant of the room
                const participant = await prisma.participant.findUnique({
                    where: {
                        userId_roomId: {
                            userId: userId,
                            roomId: roomId
                        }
                    }
                });

                if (participant) {
                    socket.join(roomId);
                    logger.info(`Socket ${socket.id} joined room ${roomId}`);
                } else {
                    logger.warn(`Unauthorized join attempt: User ${userId} tried to join room ${roomId}`);
                }
            } catch (error) {
                logger.error(`Error joining room: ${error}`);
            }
        });

        socket.on("send_message", async (data: any) => {
            // Verify sender matches authenticated user
            if (data.senderId !== userId) {
                logger.warn(`Spoofed senderId in send_message: ${userId} tried to act as ${data.senderId}`);
                return;
            }

            // Verify room participation (double check or rely on room join)
            // Ideally we check if user is serving in room
            // Since we only emit to room, and user must join room to receive, we are somewhat safe.
            // But user could emit to room they haven't joined.

            // Strict check:
            const isParticipant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });

            if (!isParticipant) {
                logger.warn(`Unauthorized message send: User ${userId} in room ${data.roomId}`);
                return;
            }

            logger.info(`Message received in room ${data.roomId} from ${userId}`);
            io.to(data.roomId).emit("receive_message", data);
        });

        // Other events - similarly apply checks or trust room mechanism if room join is secured
        // Since we gated join_room, simple broadcasts to room are relatively safe from *receiving* unauthorized data.
        // But *sending* requires checks if we want to be strict.

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
                logger.info(`Socket disconnected: ${socket.id}`);
            }
        });
    });

    httpServer.listen(port, () => {
        logger.info(`> Ready on http://${hostname}:${port}`);
    });
});
