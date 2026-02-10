import { z } from "zod";

export const RoomCreationSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal("")),
    isGroup: z.boolean(),
    participantIds: z.array(z.string().uuid()),
});

export const MessageSchema = z.object({
    content: z.string().optional(),
    fileUrl: z.string().url().optional().or(z.literal("")),
    type: z.enum(["text", "audio", "image"]),
    roomId: z.string().uuid(),
    mentions: z.array(z.string()).optional(),
    replyToId: z.string().uuid().optional(),
});
