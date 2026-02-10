"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Check, CheckCheck } from "lucide-react"

interface MessageInfoModalProps {
    isOpen: boolean
    onClose: () => void
    message: any
}

export function MessageInfoModal({ isOpen, onClose, message }: MessageInfoModalProps) {
    if (!message) return null

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Pending..."
        return format(new Date(dateString), "PPpp")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Message Info</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-white/5">
                        <p className="text-lg">{message.content}</p>
                    </div>

                    <div className="space-y-4">
                        {/* Read */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                <CheckCheck className={`w-5 h-5 ${message.readAt ? "text-blue-500" : "text-gray-500"}`} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Read</h4>
                                <p className="text-sm text-gray-400">{formatDate(message.readAt)}</p>
                            </div>
                        </div>

                        {/* Delivered */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                <CheckCheck className={`w-5 h-5 ${message.deliveredAt ? "text-gray-400" : "text-gray-600"}`} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Delivered</h4>
                                <p className="text-sm text-gray-400">{formatDate(message.deliveredAt)}</p>
                            </div>
                        </div>

                        {/* Sent */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                <Check className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Sent</h4>
                                <p className="text-sm text-gray-400">{formatDate(message.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
