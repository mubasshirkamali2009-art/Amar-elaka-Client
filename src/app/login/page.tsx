"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { authClient } from "@/lib/utils/auth-client";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) throw new Error(error.message);

            toast.success("Successfully logged in!");
            window.location.href = "/";
        } catch (err: any) {
            toast.error(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    // Google Auth Handler
    const handleGoogleAuth = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
            });
        } catch (err: any) {
            toast.error("Google login failed. Try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0B132B] text-slate-200 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
            {/* Card Container */}
            <div className="w-full max-w-md bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

                {/* Subtle grid background pattern matching the map view */}
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"
                />

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Welcome Back
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        {/* Primary Orange Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-[#FF6332] hover:bg-[#ff511d] active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#FF6332]/20 transition duration-150 disabled:opacity-50 text-sm sm:text-base"
                        >
                            {loading ? "Signing In..." : "Sign In"}
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

                    {/* Google Sign In */}
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

                    {/* Footer Navigation Link */}
                    <p className="text-center text-xs sm:text-sm text-slate-400">
                        Don't have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-[#00D2FF] hover:underline font-semibold ml-1"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}