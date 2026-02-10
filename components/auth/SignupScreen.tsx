"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, User, Lock, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

interface SignupScreenProps {
    onSignupSuccess: () => void
    onToggleLogin: () => void
}

export function SignupScreen({ onSignupSuccess, onToggleLogin }: SignupScreenProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Form Data
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [signupToken, setSignupToken] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch('/api/auth/otp/send-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok) {
                setStep(2)
            } else {
                setError(data.error || "Failed to send verification code")
            }
        } catch (error) {
            console.error("Error sending OTP:", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp.trim()) return

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch('/api/auth/otp/verify-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            })

            const data = await res.json()

            if (res.ok) {
                setSignupToken(data.signupToken)
                setStep(3)
            } else {
                setError(data.error || "Invalid verification code")
            }
        } catch (error) {
            console.error("Error verifying OTP:", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Complete Signup
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) return

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
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signupToken,
                    username,
                    password
                }),
            })

            const data = await res.json()

            if (res.ok) {
                // Auto-login after successful signup
                const result = await signIn('credentials', {
                    emailOrUsername: email,
                    password,
                    redirect: false,
                })

                if (result?.ok) {
                    onSignupSuccess()
                } else {
                    setError("Account created! Please login.")
                    setTimeout(() => onToggleLogin(), 2000)
                }
            } else {
                setError(data.error || "Failed to create account")
            }
        } catch (error) {
            console.error("Failed to sign up", error)
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
                            <h3 className="text-xl font-semibold text-white">Enter your email</h3>
                            <p className="text-sm text-gray-400">We'll send you a verification code</p>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500/50"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                                disabled={!email.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Next <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
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
                            <h3 className="text-xl font-semibold text-white">Check your email</h3>
                            <p className="text-sm text-gray-400">We sent a 6-digit code to {email}</p>
                        </div>
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500/50 h-14"
                                    autoFocus
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                            </div>
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
                                    className="text-purple-400 hover:text-purple-300"
                                    disabled={isLoading}
                                >
                                    Resend Code
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                                disabled={otp.length !== 6 || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Verify <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </motion.div>
                )
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2 text-center mb-6">
                            <h3 className="text-xl font-semibold text-white">Complete Profile</h3>
                            <p className="text-sm text-gray-400">Set up your username and password</p>
                        </div>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500/50"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500/50"
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
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500/50"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                                disabled={!username.trim() || !password.trim() || !confirmPassword.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
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
                    <CardHeader className="text-center space-y-2 pb-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Join ChatMe
                        </CardTitle>
                        <div className="flex justify-center gap-2 mt-4">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-purple-500" : s < step ? "w-8 bg-green-500" : "w-4 bg-gray-700"
                                        }`}
                                />
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <AnimatePresence mode="wait">
                            {renderStep()}
                        </AnimatePresence>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-white/5 pt-4">
                        <p className="text-sm text-gray-400">
                            Already have an account?{" "}
                            <button onClick={onToggleLogin} className="text-purple-400 hover:underline">
                                Login
                            </button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
