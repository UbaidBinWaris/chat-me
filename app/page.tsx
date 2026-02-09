"use client"

import { useState } from "react"
import { JoinScreen } from "@/components/chat/JoinScreen"
import { ChatLayout } from "@/components/chat/ChatLayout"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  if (!currentUser) {
    return <JoinScreen onJoin={setCurrentUser} />
  }

  return <ChatLayout currentUser={currentUser} />
}
