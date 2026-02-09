"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"

interface ForgotPasswordScreenProps {
    onBackToLogin: () => void
    onOtpSent?: (email: string) => void
}

export function ForgotPasswordScreen({ onBackToLogin, onOtpSent }: ForgotPasswordScreenProps) {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsLoading(true)
        setError("")
        setMessage("")

        try {
            const res = await fetch('/api/auth/send-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                setMessage(data.message || "Reset code sent to your email")
                // Optionally navigate to OTP verification screen
                if (onOtpSent) {
                    setTimeout(() => onOtpSent(email), 1500)
                }
            } else {
                setError(data.error || "Failed to send reset code")
            }
        } catch (error) {
            console.error("Failed to send reset code", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Forgot Password?
                        </CardTitle>
                        <p className="text-gray-400 text-sm">
                            Enter your email and we'll send you a 6-digit code.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-cyan-500/50"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {message && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                    <p className="text-green-400 text-sm text-center">{message}</p>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20"
                                disabled={!email.trim() || isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <button
                            onClick={onBackToLogin}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
