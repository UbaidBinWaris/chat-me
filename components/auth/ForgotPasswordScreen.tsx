"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Mail, Key, Lock, CheckCircle, Loader2 } from "lucide-react"

interface ForgotPasswordScreenProps {
    onBackToLogin: () => void
}

export function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
    const [step, setStep] = useState(1) // 1: Email, 2: OTP & New Password, 3: Success
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    // Step 1: Send Reset OTP
    const handleSendOtp = async (e: React.FormEvent) => {
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
                setTimeout(() => {
                    setStep(2)
                    setMessage("")
                }, 1000)
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

    // Step 2: Verify OTP and Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp.trim() || !password.trim() || !confirmPassword.trim()) return

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch('/api/auth/verify-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: password }),
            })

            const data = await res.json()

            if (res.ok) {
                setStep(3)
                setTimeout(() => {
                    onBackToLogin()
                }, 3000)
            } else {
                setError(data.error || "Failed to reset password")
            }
        } catch (error) {
            console.error("Failed to reset password", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2 text-center mb-6">
                            <p className="text-gray-400 text-sm">
                                Enter your email and we'll send you a 6-digit code.
                            </p>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-4">
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
                                        disabled={isLoading}
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
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : "Send Reset Code"}
                            </Button>
                        </form>
                    </motion.div>
                )
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2 text-center mb-6">
                            <p className="text-gray-400 text-sm">
                                Enter the 6-digit code sent to <span className="text-white">{email}</span>
                            </p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="text"
                                        placeholder="6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-cyan-500/50 text-center text-lg tracking-widest"
                                        maxLength={6}
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="password"
                                        placeholder="New Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-cyan-500/50"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-cyan-500/50"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <div className="flex justify-between items-center text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Change Email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    className="text-cyan-400 hover:text-cyan-300"
                                    disabled={isLoading}
                                >
                                    Resend Code
                                </button>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20"
                                disabled={!otp.trim() || !password.trim() || !confirmPassword.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : "Reset Password"}
                            </Button>
                        </form>
                    </motion.div>
                )
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-4 py-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">Password Reset Successful!</h2>
                        <p className="text-gray-400">Redirecting you to login...</p>
                    </motion.div>
                )
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Forgot Password?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="wait">
                            {renderStep()}
                        </AnimatePresence>
                    </CardContent>
                    {step !== 3 && (
                        <CardFooter className="justify-center border-t border-white/5 pt-4">
                            <button
                                onClick={onBackToLogin}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </button>
                        </CardFooter>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
