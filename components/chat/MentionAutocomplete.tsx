"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getAvatar } from "@/lib/avatar"

interface User {
    id: string
    username: string
    image?: string | null
    bio?: string | null
}

interface MentionAutocompleteProps {
    participants: User[]
    query: string
    onSelect: (username: string) => void
    onClose: () => void
    position: { top: number; left: number }
}

export function MentionAutocomplete({
    participants,
    query,
    onSelect,
    onClose,
    position
}: MentionAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    // Filter participants based on query
    const filteredParticipants = participants.filter(p =>
        p.username.toLowerCase().startsWith(query.toLowerCase())
    )

    // Reset selected index when filtered list changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredParticipants.length === 0) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(prev =>
                        prev < filteredParticipants.length - 1 ? prev + 1 : prev
                    )
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
                    break
                case 'Enter':
                    e.preventDefault()
                    if (filteredParticipants[selectedIndex]) {
                        onSelect(filteredParticipants[selectedIndex].username)
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [filteredParticipants, selectedIndex, onSelect, onClose])

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    }, [selectedIndex])

    if (filteredParticipants.length === 0) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                style={{
                    bottom: position.top,
                    left: position.left,
                    maxHeight: '200px',
                    minWidth: '250px'
                }}
            >
                <div
                    ref={listRef}
                    className="overflow-y-auto max-h-[200px] custom-scrollbar"
                >
                    {filteredParticipants.map((participant, index) => (
                        <button
                            key={participant.id}
                            onClick={() => onSelect(participant.username)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                index === selectedIndex
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-300 hover:bg-white/5"
                            )}
                        >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-800 border border-white/10">
                                <Image
                                    src={getAvatar(participant.username, participant.image)}
                                    alt={participant.username}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {participant.username}
                                </p>
                                {participant.bio && (
                                    <p className={cn(
                                        "text-xs truncate",
                                        index === selectedIndex ? "text-blue-200" : "text-gray-500"
                                    )}>
                                        {participant.bio}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
