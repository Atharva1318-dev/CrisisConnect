import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Menu, X, ChevronDown, LogOut, User, ShieldAlert } from "lucide-react";

const Navbar = () => {
    const { userData } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const containerRef = useRef();

    const handleLogout = () => {
        dispatch(setUserData(null));
        navigate("/login");
    };

    // --- GSAP ANIMATIONS ---
    useGSAP(() => {
        if (isProfileOpen) {
            gsap.fromTo(".profile-dropdown",
                { y: 10, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [isProfileOpen]);

    useGSAP(() => {
        if (isMobileMenuOpen) {
            gsap.fromTo(".mobile-menu",
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" }
            );
        }
    }, [isMobileMenuOpen]);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Live Map", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: "Contact", path: "/contact" },
    ];

    return (
        <>
            <nav ref={containerRef} className="fixed top-4 inset-x-0 max-w-7xl mx-auto z-50 px-4">
                <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg px-6 py-3 flex items-center justify-between transition-all duration-300">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-800 dark:text-zinc-100">
                        <div className="p-1.5 bg-red-600 rounded-lg text-white">
                            <ShieldAlert size={20} />
                        </div>
                        <span>Crisis<span className="text-red-600">Connect</span></span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {userData ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                        {userData.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{userData.name}</span>
                                    <ChevronDown size={14} className="text-zinc-500" />
                                </button>

                                {/* Dropdown */}
                                {isProfileOpen && (
                                    <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1">
                                        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <p className="text-xs text-zinc-500">Signed in as</p>
                                            <p className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-200">{userData.email}</p>
                                        </div>
                                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <User size={16} /> Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md hover:shadow-lg"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-zinc-600 dark:text-zinc-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu md:hidden absolute top-20 inset-x-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-base font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
                            {userData ? (
                                <button onClick={handleLogout} className="w-full py-2 bg-red-600 text-white rounded-lg font-medium">
                                    Logout
                                </button>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center border border-zinc-200 rounded-lg font-medium">
                                        Log in
                                    </Link>
                                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center bg-zinc-900 text-white rounded-lg font-medium">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            {/* Spacer */}
            <div className="h-24"></div>
        </>
    );
};

export default Navbar;