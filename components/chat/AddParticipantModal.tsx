"use client"

import { useState, useEffect } from "react"
import { X, Search, UserPlus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { getAvatar } from "@/lib/avatar"
import { toast } from "sonner"

interface AddParticipantModalProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
    currentParticipants: any[]
    onSuccess: () => void
}

export function AddParticipantModal({
    isOpen,
    onClose,
    roomId,
    currentParticipants,
    onSuccess
}: AddParticipantModalProps) {
    const [friends, setFriends] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchFriends()
            setSelectedUsers(new Set())
            setSearchQuery("")
        }
    }, [isOpen])

    const fetchFriends = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                // Filter out users who are already participants
                const participantIds = new Set(currentParticipants.map(p => p.id || p.userId))
                const availableFriends = data.filter((user: any) => !participantIds.has(user.id))
                setFriends(availableFriends)
            }
        } catch (error) {
            console.error('Error fetching friends:', error)
        }
    }

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUsers(newSelected)
    }

    const handleAdd = async () => {
        if (selectedUsers.size === 0) {
            toast.error('Please select at least one user')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/rooms/${roomId}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: Array.from(selectedUsers) })
            })

            if (res.ok) {
                const data = await res.json()
                toast.success(`Added ${data.addedParticipants?.length || 0} participant(s)`)
                onSuccess()
                onClose()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to add participants')
            }
        } catch (error) {
            toast.error('Failed to add participants')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Add Participants</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search friends..."
                            className="pl-9 bg-gray-800/50 border-white/5 focus:border-blue-500/50 text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Selected Count */}
                    {selectedUsers.size > 0 && (
                        <div className="text-sm text-gray-400">
                            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                        </div>
                    )}

                    {/* Friends List */}
                    <ScrollArea className="h-80">
                        <div className="space-y-2">
                            {filteredFriends.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'No friends found' : 'No available friends to add'}
                                </div>
                            ) : (
                                filteredFriends.map((friend) => {
                                    const isSelected = selectedUsers.has(friend.id)
                                    return (
                                        <button
                                            key={friend.id}
                                            onClick={() => toggleUser(friend.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                                    <Image
                                                        src={getAvatar(friend.username, friend.image)}
                                                        alt={friend.username}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-white">
                                                        {friend.username}
                                                    </p>
                                                    {friend.bio && (
                                                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                                            {friend.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-600'
                                                    }`}
                                            >
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAdd}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={selectedUsers.size === 0 || isLoading}
                        >
                            <UserPlus size={16} className="mr-2" />
                            Add {selectedUsers.size > 0 && `(${selectedUsers.size})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
