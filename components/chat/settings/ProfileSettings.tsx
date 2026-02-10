"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Image from "next/image"
import { Loader2, Upload, User, Phone, FileText } from "lucide-react"
import { getAvatar } from "@/lib/avatar"
import { useRouter } from "next/navigation"

interface ProfileSettingsProps {
    currentUser: any
}

export function ProfileSettings({ currentUser }: ProfileSettingsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [bio, setBio] = useState(currentUser.bio || "")
    const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || "")
    const [image, setImage] = useState(currentUser.image)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!uploadRes.ok) throw new Error("Upload failed")

            const { fileUrl } = await uploadRes.json()
            setImage(fileUrl)

            // Auto-save image update
            await updateProfile({ image: fileUrl })
            toast.success("Profile picture updated")
        } catch (error) {
            console.error("Error uploading image:", error)
            toast.error("Failed to upload image")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await updateProfile({ bio, phoneNumber })
            toast.success("Profile updated successfully")
            router.refresh()
            window.location.reload() // Force reload to ensure session updates (NextAuth can be sticky)
        } catch (error) {
            console.error("Error saving profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfile = async (data: any) => {
        const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to update profile")
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-white mb-1">Profile Information</h3>
                <p className="text-sm text-gray-400">Update your photo and personal details.</p>
            </div>

            <div className="flex items-center gap-6">
                <div
                    className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/80 transition-all group overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                >

                    <Image
                        src={getAvatar(currentUser.username, image)}
                        alt="Profile"
                        fill
                        className="object-cover"
                    />

                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-4 w-4 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium">CHANGE</span>
                    </div>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">Profile Photo</h4>
                    <p className="text-xs text-gray-500 mb-3">Click on the image to upload a new one. Recommended size: 256x256px.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs border-white/10 text-gray-300 hover:text-white"
                    >
                        Upload Image
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="bio" className="text-white">Bio</Label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Textarea
                            id="bio"
                            placeholder="Tell us a little bit about yourself"
                            className="bg-gray-900/50 border-white/10 text-white pl-9 min-h-[100px] resize-none focus:ring-blue-500/50"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={120}
                        />
                        <span className="absolute right-2 bottom-2 text-xs text-gray-500">
                            {bio.length}/120
                        </span>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            id="phone"
                            placeholder="+1 (555) 000-0000"
                            className="bg-gray-900/50 border-white/10 text-white pl-9 focus:ring-blue-500/50"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500">Used for account recovery and friend finding.</p>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
                <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
