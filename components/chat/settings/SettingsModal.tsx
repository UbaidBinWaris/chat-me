"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, MessageSquare, Shield, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileSettings } from "./ProfileSettings"
import { motion, AnimatePresence } from "framer-motion"

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: any
}

type SettingsTab = "profile" | "chat" | "account"

export function SettingsModal({ isOpen, onClose, currentUser }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile")

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-gray-950 border-white/10 text-white overflow-hidden h-[600px] flex">
                <DialogTitle className="sr-only">Settings</DialogTitle>
                {/* Left Sidebar - Navigation */}
                <div className="w-64 bg-gray-900/50 border-r border-white/10 flex flex-col p-4">
                    <div className="mb-8 pl-2">
                        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <SettingsTabButton
                            active={activeTab === "profile"}
                            onClick={() => setActiveTab("profile")}
                            icon={<User className="h-4 w-4" />}
                            label="Profile"
                        />
                        <SettingsTabButton
                            active={activeTab === "chat"}
                            onClick={() => setActiveTab("chat")}
                            icon={<MessageSquare className="h-4 w-4" />}
                            label="Chat Settings"
                        />
                        <SettingsTabButton
                            active={activeTab === "account"}
                            onClick={() => setActiveTab("account")}
                            icon={<Shield className="h-4 w-4" />}
                            label="Account & Security"
                        />
                    </nav>

                    <div className="pt-4 border-t border-white/10 text-xs text-gray-600 text-center">
                        Gixiai Chats v1.0.0
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-semibold capitalize">{activeTab} Settings</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 -mr-2">
                            <X className="h-5 w-5 text-gray-400" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === "profile" && (
                                    <ProfileSettings currentUser={currentUser} />
                                )}
                                {activeTab === "chat" && (
                                    <div className="text-center py-20 text-gray-500">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>Chat settings coming soon</p>
                                    </div>
                                )}
                                {activeTab === "account" && (
                                    <div className="text-center py-20 text-gray-500">
                                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>Account settings coming soon</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SettingsTabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
        >
            {icon}
            {label}
        </button>
    )
}
