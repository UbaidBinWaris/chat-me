"use client"

import { useState } from "react"
import { X, Users, Calendar, Crown, UserMinus, UserPlus, Settings, LogOut, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getAvatar } from "@/lib/avatar"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GroupInfoPanelProps {
    isOpen: boolean
    onClose: () => void
    room: any
    currentUserId: string
    onAddParticipants: () => void
    onRefresh: () => void
}

export function GroupInfoPanel({
    isOpen,
    onClose,
    room,
    currentUserId,
    onAddParticipants,
    onRefresh
}: GroupInfoPanelProps) {
    const [removeUserId, setRemoveUserId] = useState<string | null>(null)
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    if (!room || !isOpen) return null

    const currentUserParticipant = room.participants?.find((p: any) => p.id === currentUserId || p.userId === currentUserId)
    const isAdmin = currentUserParticipant?.role === 'admin'
    const isCreator = room.createdBy?.id === currentUserId

    const handleRemoveParticipant = async (userId: string) => {
        try {
            const res = await fetch(`/api/rooms/${room.id}/participants/${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Participant removed')
                setRemoveUserId(null)
                onRefresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to remove participant')
            }
        } catch (error) {
            toast.error('Failed to remove participant')
        }
    }

    const handlePromoteToAdmin = async (userId: string) => {
        try {
            const res = await fetch(`/api/rooms/${room.id}/participants/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'admin' })
            })

            if (res.ok) {
                toast.success('Promoted to admin')
                onRefresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to promote user')
            }
        } catch (error) {
            toast.error('Failed to promote user')
        }
    }

    const handleDemoteToMember = async (userId: string) => {
        try {
            const res = await fetch(`/api/rooms/${room.id}/participants/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'member' })
            })

            if (res.ok) {
                toast.success('Demoted to member')
                onRefresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to demote user')
            }
        } catch (error) {
            toast.error('Failed to demote user')
        }
    }

    const handleLeaveGroup = async () => {
        try {
            const res = await fetch(`/api/rooms/${room.id}/leave`, {
                method: 'POST'
            })

            if (res.ok) {
                toast.success('Left group')
                onClose()
                window.location.reload() // Refresh to update room list
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to leave group')
            }
        } catch (error) {
            toast.error('Failed to leave group')
        }
    }

    const handleDeleteGroup = async () => {
        try {
            const res = await fetch(`/api/rooms/${room.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Group deleted')
                onClose()
                window.location.reload() // Refresh to update room list
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to delete group')
            }
        } catch (error) {
            toast.error('Failed to delete group')
        }
    }

    return (
        <>
            <div
                className={cn(
                    "fixed inset-y-0 right-0 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ease-in-out z-40",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Group Info</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X size={20} className="text-gray-400" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Group Image & Name */}
                            <div className="flex flex-col items-center space-y-3">
                                <div className="relative w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden">
                                    {room.image ? (
                                        <Image src={room.image} alt={room.name} fill className="object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">{room.name?.[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                                    {room.description && (
                                        <p className="text-sm text-gray-400 mt-1">{room.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Group Details */}
                            <div className="space-y-3 bg-gray-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Users size={16} className="text-gray-400" />
                                    <span className="text-gray-300">{room.participants?.length || 0} participants</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="text-gray-300">
                                        Created {new Date(room.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {room.createdBy && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Crown size={16} className="text-yellow-500" />
                                        <span className="text-gray-300">
                                            Created by {room.createdBy.username}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Admin Controls */}
                            {isAdmin && (
                                <div className="space-y-2">
                                    <Button
                                        onClick={onAddParticipants}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        <UserPlus size={16} className="mr-2" />
                                        Add Participants
                                    </Button>
                                </div>
                            )}

                            {/* Participants List */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                    Participants
                                </h4>
                                <div className="space-y-2">
                                    {room.participants?.map((participant: any) => {
                                        const user = participant.user || participant
                                        const role = participant.role || 'member'
                                        const isParticipantAdmin = role === 'admin'
                                        const isCurrentUser = user.id === currentUserId

                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        <Image
                                                            src={getAvatar(user.username, user.image)}
                                                            alt={user.username}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {user.username} {isCurrentUser && '(You)'}
                                                        </p>
                                                        {isParticipantAdmin && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Shield size={12} className="text-yellow-500" />
                                                                <span className="text-xs text-yellow-500">Admin</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Admin Actions */}
                                                {isAdmin && !isCurrentUser && (
                                                    <div className="flex items-center gap-1">
                                                        {isCreator && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    isParticipantAdmin
                                                                        ? handleDemoteToMember(user.id)
                                                                        : handlePromoteToAdmin(user.id)
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {isParticipantAdmin ? 'Demote' : 'Make Admin'}
                                                            </Button>
                                                        )}
                                                        {!isParticipantAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setRemoveUserId(user.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            >
                                                                <UserMinus size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                {!isCreator && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setLeaveDialogOpen(true)}
                                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    >
                                        <LogOut size={16} className="mr-2" />
                                        Exit Group
                                    </Button>
                                )}
                                {isCreator && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    >
                                        <X size={16} className="mr-2" />
                                        Delete Group
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Remove Participant Confirmation */}
            <AlertDialog open={!!removeUserId} onOpenChange={() => setRemoveUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this participant from the group?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => removeUserId && handleRemoveParticipant(removeUserId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Leave Group Confirmation */}
            <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to leave this group? You'll need to be re-added by an admin to rejoin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLeaveGroup}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Group Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this group? This action cannot be undone and all messages will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteGroup}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
