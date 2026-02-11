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
const port = parseInt(process.env.PORT || "4000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

declare global {
    var io: Server;
}

app.prepare().then(async () => {
    const server = express();
    const httpServer = createServer(server);

    const io = new Server(httpServer, {
        cors: { origin: "*" }
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

            console.log("Socket auth failed: No session data found");
            return next(new Error("Unauthorized: No session"));
        } catch (err) {
            console.error("Socket auth error details:", err);
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


        socket.on("delete_message", async (data: { messageId: string, roomId: string }) => {
            const isParticipant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (isParticipant) {
                io.to(data.roomId).emit("message_deleted", data.messageId);
            }
        });

        socket.on("mark_read", async (data: { roomId: string, userId: string }) => {
            // Simplified: no op or broadcast if needed
        });

        // Group management events - strict checks recommended for admin actions
        socket.on("participant_added", async (data: { roomId: string, participants: any[], addedBy: string }) => {
            const participant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (participant) {
                io.to(data.roomId).emit("participant_added", data);
            }
        });

        socket.on("participant_removed", async (data: { roomId: string, userId: string, removedBy: string }) => {
            const participant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (participant) {
                io.to(data.roomId).emit("participant_removed", data);
            }
        });

        socket.on("participant_role_changed", async (data: { roomId: string, userId: string, role: string, changedBy: string }) => {
            const participant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (participant && participant.role === 'admin') { // Admin check?
                io.to(data.roomId).emit("participant_role_changed", data);
            }
        });

        socket.on("group_updated", async (data: { roomId: string, name?: string, description?: string, image?: string, updatedBy: string }) => {
            const participant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (participant) {
                io.to(data.roomId).emit("group_updated", data);
            }
        });

        socket.on("user_left_group", async (data: { roomId: string, userId: string, username: string }) => {
            // User can only make themselves leave, effectively
            if (data.userId === userId) {
                io.to(data.roomId).emit("user_left_group", data);
            }
        });

        socket.on("group_deleted", async (data: { roomId: string, deletedBy: string }) => {
            const participant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });
            if (participant && participant.role === 'admin') {
                io.to(data.roomId).emit("group_deleted", data);
            }
        });

        socket.on("add_reaction", async (data: { messageId: string, emoji: string, userId: string, roomId: string, reaction: any }) => {
            // Verify user is distinct or matches auth
            if (data.userId !== userId) return;

            const isParticipant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });

            if (isParticipant) {
                logger.info(`Reaction added: ${data.emoji} by ${userId}`);
                io.to(data.roomId).emit("reaction_added", data);
            }
        });

        socket.on("remove_reaction", async (data: { messageId: string, emoji: string, userId: string, roomId: string }) => {
            if (data.userId !== userId) return;

            const isParticipant = await prisma.participant.findUnique({
                where: { userId_roomId: { userId, roomId: data.roomId } }
            });

            if (isParticipant) {
                logger.info(`Reaction removed: ${data.emoji} by ${userId}`);
                io.to(data.roomId).emit("reaction_removed", data);
            }
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
                logger.info(`Socket disconnected: ${socket.id}`);
            }
        });
    });

    httpServer.listen(port, () => {
        logger.info(`> Ready on http://${hostname}:${port}`);
    });
});
