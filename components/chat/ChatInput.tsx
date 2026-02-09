"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Smile, Mic, Square, FileIcon, X } from "lucide-react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"

interface ChatInputProps {

    onSendMessage: (content: string, type?: "text" | "audio" | "image" | "file", fileUrl?: string) => void
    isLoading?: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [message, setMessage] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!message.trim() && selectedFiles.length === 0) || isLoading || isUploading) return

        setIsUploading(true)

        if (message.trim()) {
            if (selectedFiles.length === 1) {
                // Will be handled in loop below
            } else {
                onSendMessage(message, "text")
                setMessage("")
            }
        }

        if (selectedFiles.length > 0) {
            await Promise.all(selectedFiles.map(async (file, index) => {
                const caption = (selectedFiles.length === 1 && message.trim()) ? message : file.name
                await uploadFileAndSend(file, caption)
            }))

            setSelectedFiles([])
            if (selectedFiles.length === 1) setMessage("")
        }

        setIsUploading(false)
        setShowEmojiPicker(false)

        // Keep focus
        setTimeout(() => inputRef.current?.focus(), 10)
    }

    const uploadFileAndSend = async (file: File, caption: string) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                const type = file.type.startsWith('image/') ? 'image' : 'file'
                onSendMessage(caption || file.name, type, data.fileUrl)
            }
        } catch (error) {
            console.error("File upload failed:", error)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                await uploadAudio(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const uploadAudio = async (blob: Blob) => {
        const formData = new FormData()
        // Use a unique filename or let the server handle it
        formData.append('file', blob, 'voice-message.webm')

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                // Send as audio message
                onSendMessage("Voice Message", "audio", data.fileUrl)
            }
        } catch (e) {
            console.error("Upload failed", e)
        }
    }

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setMessage((prev) => prev + emojiData.emoji)
        // setShowEmojiPicker(false) // Keep open for multiple emojis?
    }

    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        setSelectedFiles(prev => [...prev, ...Array.from(files)])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        const newFiles: File[] = []
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile()
                if (file) newFiles.push(file)
            }
        }
        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles])
            e.preventDefault()
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="p-4 bg-gray-900/50 backdrop-blur-md border-t border-white/10">
            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative bg-gray-800 rounded-lg group shrink-0">
                            <button
                                onClick={() => removeFile(index)}
                                type="button"
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                            >
                                <X size={12} />
                            </button>
                            {file.type.startsWith('image/') ? (
                                <div className="h-20 w-20 rounded-md overflow-hidden border border-white/10">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-20 w-24 flex flex-col items-center justify-center p-2 border border-white/10 rounded-md">
                                    <FileIcon className="text-blue-400 mb-1" size={24} />
                                    <span className="text-[10px] text-gray-300 w-full truncate text-center">{file.name}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 max-w-4xl mx-auto"
            >

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-20 right-0 z-50">
                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                        <div className="relative z-50">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={"dark" as any}
                                lazyLoadEmojis={true}
                            />
                        </div>
                    </div>
                )}

                {/* Attachments */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple // Allow multiple files
                    onChange={handleFileChange}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleFileSelect}
                    className="text-gray-400 hover:text-white shrink-0"
                >
                    <Paperclip size={20} />
                </Button>

                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        onPaste={handlePaste}
                        placeholder={isRecording ? "Recording..." : selectedFiles.length > 0 ? (selectedFiles.length === 1 ? "Add a caption..." : "Type a message...") : "Type a message..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`bg-gray-800/50 text-white border-none focus:ring-blue-500/50 h-12 rounded-full px-6 pr-10 w-full transition-all duration-200 focus:bg-gray-800 ${isRecording ? "text-red-500 animate-pulse bg-red-500/10 placeholder:text-red-400" : ""}`}
                        disabled={isLoading || isRecording || isUploading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2 top-1.5 text-gray-400 hover:text-yellow-400 h-9 w-9"
                    >
                        <Smile size={18} />
                    </Button>
                </div>

                {message.trim() || selectedFiles.length > 0 ? (
                    <Button
                        size="icon"
                        type="submit"
                        disabled={isLoading || isUploading}
                        className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shrink-0 text-white transition-transform active:scale-95"
                    >
                        <Send size={20} />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`h-12 w-12 rounded-full shrink-0 text-white transition-all duration-300 ${isRecording ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}
                    >
                        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
                    </Button>
                )}
            </form>
        </div>
    )
}
