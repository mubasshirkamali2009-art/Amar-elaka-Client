"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/utils/auth-client";
import { useState } from "react";
import logo from "@/assests/logo.png";

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, isPending } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Map", href: "/map" },
        { name: "Leaderboard", href: "/leaderboard" },
        { name: "Run", href: "/run" },
    ];

    return (
        <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo & Site Name */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative w-10 h-10 overflow-hidden rounded-full">
                            <Image
                                src={logo}
                                alt="amar elaka logo"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                priority
                            />
                        </div>
                        <span className="text-xl font-bold tracking-wide text-white">
                            Amar <span className="text-orange-500">Elaka</span>
                        </span>
                    </Link>

                    {/* Main Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-orange-400 ${isActive(link.href) ? "text-orange-500 font-semibold" : "text-gray-300"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* User Section (Right Side) */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isPending ? (
                            // Loading Skeleton
                            <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse border border-slate-700" />
                        ) : session?.user ? (
                            // Logged In: Avatar & Profile Menu
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center focus:outline-none"
                                >
                                    <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white border-2 border-slate-700 hover:border-orange-400 transition overflow-hidden">
                                        {session.user.image ? (
                                            <img
                                                src={session.user.image}
                                                alt={session.user.name || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            session.user.name?.charAt(0).toUpperCase() || "U"
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-2 border border-slate-700 z-50">
                                        <div className="px-4 py-2 border-b border-slate-700">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {session.user.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {session.user.email}
                                            </p>
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white"
                                        >
                                            Profile
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                signOut();
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Not Logged In: Login & Signup
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-300 hover:text-white transition"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/singup"
                                    className="text-sm font-medium bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg transition text-white"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Responsive Drawer */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800 border-b border-slate-700 px-4 pt-2 pb-4 space-y-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block text-base font-medium ${isActive(link.href) ? "text-orange-400" : "text-gray-300"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div className="pt-3 border-t border-slate-700">
                        {session?.user ? (
                            <div className="space-y-2">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center space-x-3 py-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white overflow-hidden">
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            session.user.name?.charAt(0).toUpperCase() || "U"
                                        )}
                                    </div>
                                    <span className="text-gray-200 font-medium">My Profile</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        signOut();
                                    }}
                                    className="w-full text-left py-2 text-sm text-red-400 font-medium"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-center w-full py-2 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/singup"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-center w-full py-2 bg-orange-600 rounded-lg text-white font-medium hover:bg-orange-500"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}