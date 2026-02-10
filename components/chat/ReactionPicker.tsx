"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ReactionPickerProps {
    isVisible: boolean
    onReact: (emoji: string) => void
    className?: string
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

export function ReactionPicker({ isVisible, onReact, className }: ReactionPickerProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "absolute bottom-full mb-2 left-0 z-50",
                        "bg-gray-800/95 backdrop-blur-md border border-white/10 rounded-full shadow-2xl",
                        "flex items-center gap-1 px-2 py-1.5",
                        className
                    )}
                >
                    {COMMON_EMOJIS.map((emoji) => (
                        <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onReact(emoji)}
                            className="text-2xl hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                        >
                            {emoji}
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
