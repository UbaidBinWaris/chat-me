"use client"

import { useState } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { SignupScreen } from "@/components/auth/SignupScreen"
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen"
import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen"
import { ChatLayout } from "@/components/chat/ChatLayout"

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password'

function HomeContent() {
  const { data: session, status } = useSession()
  const [authView, setAuthView] = useState<AuthView>('login')

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // If user is authenticated, show chat
  if (session?.user) {
    return <ChatLayout currentUser={session.user} />
  }

  // Show appropriate auth screen based on current view
  switch (authView) {
    case 'signup':
      return (
        <SignupScreen
          onSignupSuccess={() => setAuthView('login')}
          onToggleLogin={() => setAuthView('login')}
        />
      )
    case 'forgot-password':
      return (
        <ForgotPasswordScreen
          onBackToLogin={() => setAuthView('login')}
        />
      )
    case 'reset-password':
      return (
        <ResetPasswordScreen
          onResetSuccess={() => setAuthView('login')}
        />
      )
    case 'login':
    default:
      return (
        <LoginScreen
          onLoginSuccess={() => {
            // Session will be updated automatically by NextAuth
            // Component will re-render when session changes
          }}
          onToggleSignup={() => setAuthView('signup')}
          onForgotPassword={() => setAuthView('forgot-password')}
        />
      )
  }
}

export default function Home() {
  // Check if we should show reset password screen based on URL
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('token')) {
      return (
        <SessionProvider>
          <ResetPasswordScreen
            onResetSuccess={() => {
              window.location.href = '/'
            }}
          />
        </SessionProvider>
      )
    }
  }

  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  )
}
