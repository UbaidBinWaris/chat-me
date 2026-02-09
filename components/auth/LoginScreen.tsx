"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion } from "framer-motion"

interface LoginScreenProps {
    onLoginSuccess: () => void
    onToggleSignup: () => void
    onForgotPassword: () => void
}

export function LoginScreen({ onLoginSuccess, onToggleSignup, onForgotPassword }: LoginScreenProps) {
    const [emailOrUsername, setEmailOrUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!emailOrUsername.trim() || !password.trim()) return

        setIsLoading(true)
        setError("")

        try {
            const result = await signIn('credentials', {
                emailOrUsername,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError(result.error)
            } else if (result?.ok) {
                onLoginSuccess()
            }
        } catch (error) {
            console.error("Failed to login", error)
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
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <p className="text-gray-400 text-sm">
                            Enter your credentials to access your chats.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Email or Username"
                                    value={emailOrUsername}
                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-blue-500/50"
                                    autoFocus
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={onForgotPassword}
                                    className="text-sm text-blue-400 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                                disabled={!emailOrUsername.trim() || !password.trim() || isLoading}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{" "}
                            <button onClick={onToggleSignup} className="text-blue-400 hover:underline">
                                Sign up
                            </button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
