"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Phone, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { format } from "date-fns"

interface UserInfoPanelProps {
    isOpen: boolean
    onClose: () => void
    user: any
}

export function UserInfoPanel({ isOpen, onClose, user }: UserInfoPanelProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-white/10 z-30 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-gray-900/50">
                            <h2 className="font-semibold text-white">Contact Info</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 mb-4">
                                    {user?.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.username}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                            {user?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{user?.username}</h3>
                                <p className="text-blue-400 text-sm">Online</p>
                            </div>

                            {/* Bio */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {user?.bio || "No bio available."}
                                </p>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Email Address</p>
                                        <p className="text-sm truncate" title={user?.email}>{user?.email}</p>
                                    </div>
                                </div>

                                {user?.phoneNumber && (
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                                            <Phone size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm">{user.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Joined</p>
                                        <p className="text-sm">
                                            {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
