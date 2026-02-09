"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Smile } from "lucide-react"

interface ChatInputProps {
    onSendMessage: (content: string) => void
    isLoading?: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [message, setMessage] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isLoading) return

        onSendMessage(message)
        setMessage("")

        // Keep focus
        setTimeout(() => inputRef.current?.focus(), 10)
    }

    return (
        <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-white/10">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 max-w-4xl mx-auto"
            >
                {/* Attachments (Placeholder) */}
                <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-white shrink-0">
                    <Paperclip size={20} />
                </Button>

                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-gray-800/50 text-white border-none focus:ring-blue-500/50 h-12 rounded-full px-6 pr-10 w-full transition-all duration-200 focus:bg-gray-800"
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1.5 text-gray-400 hover:text-yellow-400 h-9 w-9"
                    >
                        <Smile size={18} />
                    </Button>
                </div>

                <Button
                    size="icon"
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shrink-0 text-white transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={20} />
                </Button>
            </form>
        </div>
    )
}
