"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authClient } from "@/lib/utils/auth-client";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Upload image to ImgBB
    const uploadToImgBB = async (file: File): Promise<string> => {
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

        if (!apiKey) {
            throw new Error("ImgBB API key is missing. Check your .env.local file.");
        }

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "Failed to upload image to ImgBB");
        }
    };

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = "";

            // 1. Upload profile image to ImgBB if selected
            if (imageFile) {
                toast.loading("Uploading image to ImgBB...", { id: "img-upload" });
                imageUrl = await uploadToImgBB(imageFile);
                toast.dismiss("img-upload");
            }

            // 2. Sign up user with Better Auth
            const { error } = await authClient.signUp.email({
                email,
                password,
                name,
                image: imageUrl || undefined,
            });

            if (error) throw new Error(error.message);

            toast.success("Account created successfully!");

            // Client-side redirect keeps toast state active across pages
            router.push("/");
            router.refresh();
        } catch (err: any) {
            toast.dismiss("img-upload");
            toast.error(err.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    // Google Signup Handler
    const handleGoogleAuth = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } catch (err: any) {
            toast.error("Google authentication failed.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0B132B] text-slate-200 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
            {/* Card Container */}
            <div className="w-full max-w-md bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

                {/* Subtle grid background pattern matching map theme */}
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"
                />

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Create Account
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Join now to start claiming territory
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#172136] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2FF] transition shadow-inner"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="runner@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#172136] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2FF] transition shadow-inner"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#172136] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2FF] transition shadow-inner"
                            />
                        </div>

                        {/* Profile Picture Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Profile Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="w-full bg-[#172136] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#00D2FF]/10 file:text-[#00D2FF] hover:file:bg-[#00D2FF]/20 cursor-pointer focus:outline-none transition"
                            />
                        </div>

                        {/* Orange Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-[#FF6332] hover:bg-[#ff511d] active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#FF6332]/20 transition duration-150 disabled:opacity-50 text-sm sm:text-base"
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800" />
                        </div>
                        <span className="relative bg-[#0D1527] px-3 text-[11px] uppercase tracking-wider text-slate-500">
                            Or
                        </span>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleAuth}
                        type="button"
                        className="w-full bg-[#172136] hover:bg-[#202d48] active:scale-[0.98] border border-slate-700/80 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-sm transition shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#EA4335"
                                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.6-.8-1-1.8-1-2.9z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Navigation Link */}
                    <p className="text-center text-xs sm:text-sm text-slate-400">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-[#00D2FF] hover:underline font-semibold ml-1"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}