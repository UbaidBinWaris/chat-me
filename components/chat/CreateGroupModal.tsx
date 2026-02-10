"use client"

import { useState, useEffect } from "react"
import { X, Search, Users, Check, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { getAvatar } from "@/lib/avatar"
import { toast } from "sonner"

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    currentUserId: string
    onSuccess: (roomId: string) => void
}

export function CreateGroupModal({
    isOpen,
    onClose,
    currentUserId,
    onSuccess
}: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState("")
    const [groupDescription, setGroupDescription] = useState("")
    const [groupImage, setGroupImage] = useState("")
    const [friends, setFriends] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchFriends()
            // Reset form
            setGroupName("")
            setGroupDescription("")
            setGroupImage("")
            setSelectedUsers(new Set())
            setSearchQuery("")
        }
    }, [isOpen])

    const fetchFriends = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setFriends(data)
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

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error('Please enter a group name')
            return
        }

        setIsLoading(true)
        try {
            const participantIds = [currentUserId, ...Array.from(selectedUsers)]

            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: groupName,
                    description: groupDescription,
                    image: groupImage,
                    isGroup: true,
                    participantIds
                })
            })

            if (res.ok) {
                const data = await res.json()
                toast.success('Group created successfully')
                onSuccess(data.id)
                onClose()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to create group')
            }
        } catch (error) {
            toast.error('Failed to create group')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Group</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                            Group Name *
                        </label>
                        <Input
                            placeholder="Enter group name..."
                            className="bg-gray-800/50 border-white/5 focus:border-blue-500/50 text-white"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            maxLength={50}
                        />
                    </div>

                    {/* Group Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                            Description (Optional)
                        </label>
                        <Textarea
                            placeholder="Enter group description..."
                            className="bg-gray-800/50 border-white/5 focus:border-blue-500/50 text-white resize-none"
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            rows={3}
                            maxLength={200}
                        />
                    </div>

                    {/* Group Image URL (simplified for now) */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                            Group Icon URL (Optional)
                        </label>
                        <Input
                            placeholder="https://example.com/image.jpg"
                            className="bg-gray-800/50 border-white/5 focus:border-blue-500/50 text-white"
                            value={groupImage}
                            onChange={(e) => setGroupImage(e.target.value)}
                        />
                    </div>

                    {/* Add Participants */}
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                            Add Participants (Optional)
                        </label>

                        {/* Search */}
                        <div className="relative mb-2">
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
                            <div className="text-sm text-gray-400 mb-2">
                                {selectedUsers.size} participant{selectedUsers.size !== 1 ? 's' : ''} selected
                            </div>
                        )}

                        {/* Friends List */}
                        <ScrollArea className="h-48 border border-white/5 rounded-lg">
                            <div className="p-2 space-y-1">
                                {filteredFriends.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        {searchQuery ? 'No friends found' : 'No friends available'}
                                    </div>
                                ) : (
                                    filteredFriends.map((friend) => {
                                        const isSelected = selectedUsers.has(friend.id)
                                        return (
                                            <button
                                                key={friend.id}
                                                onClick={() => toggleUser(friend.id)}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        <Image
                                                            src={getAvatar(friend.username, friend.image)}
                                                            alt={friend.username}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <p className="text-sm font-medium text-white">
                                                        {friend.username}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-600'
                                                        }`}
                                                >
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

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
                            onClick={handleCreate}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={!groupName.trim() || isLoading}
                        >
                            <Users size={16} className="mr-2" />
                            Create Group
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
