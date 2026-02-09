"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

interface JoinScreenProps {
    onJoin: (user: any) => void
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
    const [username, setUsername] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            })

            const data = await res.json()

            if (res.ok) {
                onJoin(data)
            } else {
                setError(data.error || "Failed to join")
            }
        } catch (error) {
            console.error("Failed to join", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Welcome to ChatMe
                        </CardTitle>
                        <p className="text-gray-400 text-sm">
                            Enter your username to start chatting instantly.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Choose a username..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-blue-500/50"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                                disabled={!username.trim() || isLoading}
                                isLoading={isLoading}
                            >
                                {isLoading ? "Joining..." : "Enter Chat"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
