"use client"

import { useState } from "react"
import { UserPlus, Info, LogOut, Trash2 } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"

interface GroupContextMenuProps {
    children: React.ReactNode
    isGroup: boolean
    isAdmin: boolean
    isCreator: boolean
    onAddParticipants?: () => void
    onShowInfo?: () => void
    onLeaveGroup?: () => void
    onDeleteGroup?: () => void
}

export function GroupContextMenu({
    children,
    isGroup,
    isAdmin,
    isCreator,
    onAddParticipants,
    onShowInfo,
    onLeaveGroup,
    onDeleteGroup
}: GroupContextMenuProps) {
    if (!isGroup) {
        return <>{children}</>
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-gray-900 border-white/10 text-white">
                <ContextMenuItem
                    onClick={onShowInfo}
                    className="focus:bg-white/10 focus:text-white cursor-pointer"
                >
                    <Info size={16} className="mr-2" />
                    Group Info
                </ContextMenuItem>

                {isAdmin && onAddParticipants && (
                    <ContextMenuItem
                        onClick={onAddParticipants}
                        className="focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                        <UserPlus size={16} className="mr-2" />
                        Add Participant
                    </ContextMenuItem>
                )}

                <ContextMenuSeparator className="bg-white/10" />

                {!isCreator && onLeaveGroup && (
                    <ContextMenuItem
                        onClick={onLeaveGroup}
                        className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer"
                    >
                        <LogOut size={16} className="mr-2" />
                        Exit Group
                    </ContextMenuItem>
                )}

                {isCreator && onDeleteGroup && (
                    <ContextMenuItem
                        onClick={onDeleteGroup}
                        className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Group
                    </ContextMenuItem>
                )}
            </ContextMenuContent>
        </ContextMenu>
    )
}
