"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const { data: session } = useSession()

    useEffect(() => {
        if (!session?.user) return

        const socketInstance = io({
            path: "/socket.io",
            auth: {
                token: session // Pass the entire session object or just a token if available
            }
        })

        socketInstance.on("connect", () => {
            console.log("Connected to socket", socketInstance.id)
        })

        setSocket(socketInstance)

        return () => {
            socketInstance.disconnect()
        }
    }, [session])

    return socket
}
