"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

export const useSocket = (userId?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        if (!userId) return

        const socketInstance = io({
            path: "/socket.io",
            query: { userId }
        })

        socketInstance.on("connect", () => {
            console.log("Connected to socket", socketInstance.id)
        })

        setSocket(socketInstance)

        return () => {
            socketInstance.disconnect()
        }
    }, [])

    return socket
}
