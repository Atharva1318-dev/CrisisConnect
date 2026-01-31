"use client";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import clsx from "clsx";
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoListOutline,
  IoMapOutline,
  IoShieldCheckmark,
  IoMenuOutline,
  IoGridOutline,
  IoCubeOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { AlertCircle, Menu, X } from "lucide-react";
import LoginButton from "./LoginButton";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useSelector((state) => state.user);
  const location = useLocation();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 80) {
        setShowNavbar(false); // scrolling down
      } else {
        setShowNavbar(true); // scrolling up
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);



  // --- Dynamic nav links per role ---
  let navLinks = [];

  if (!userData) {
    navLinks = [
      { name: "Home", href: "/", icon: <IoHomeOutline size={20} /> },
      { name: "Crises Updates", href: "/crises", icon: <IoMapOutline size={20} /> },
      { name: "Resources", href: "/resources", icon: <IoPeopleOutline size={20} /> },
      { name: "Contact", href: "/contact", icon: <IoListOutline size={20} /> },
    ];
  } else if (userData.role === "citizen") {
    navLinks = [
      { name: "Dashboard", href: "/citizenhome", icon: <IoHomeOutline size={20} /> },
      { name: "Report", href: "/sos", icon: <IoListOutline size={20} /> },
      { name: "My Incidents", href: "/citizen/incidents", icon: <IoMapOutline size={20} /> },
      { name: "Map", href: "/citizen/map", icon: <IoMapOutline size={20} /> },
    ];
  } else if (userData.role === "agency") {
    navLinks = [
      { name: "Dashboard", href: "/agencyhome", icon: <IoHomeOutline size={20} /> },
      // { name: "Requests", href: "/agency/requests", icon: <IoListOutline size={20} /> },
      { name: "Analytics", href: "/agency/resources", icon: <IoPeopleOutline size={20} /> },
      // { name: "Teams", href: "/agency/teams", icon: <IoPeopleOutline size={20} /> },
    ];
  } else if (userData.role === "coordinator") {
    navLinks = [
      { name: "Dashboard", href: "/coordinatorhome", icon: <IoGridOutline size={18} /> },
      { name: "Inventory", href: "/coordinator/manage", icon: <IoCubeOutline size={18} /> },
    ];
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md border border-zinc-200 shadow-sm rounded-full px-6 h-14 flex items-center justify-between transition-all duration-300">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all">
              <AlertCircle size={24} className="text-white" />
            </div>
            <span className="text-gray-900 font-bold text-lg hidden sm:inline-block group-hover:text-blue-600 transition">
              CrisisAlert
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 p-1 rounded-full border border-zinc-100">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-white text-blue-600 shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                )}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {userData && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-medium text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 capitalize">
                  {userData.name?.split(' ')[0] || userData.email?.split('@')[0]}
                </span>
                <span className="capitalize">{userData.role}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <LoginButton />
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-full"
            >
              {isOpen ? <IoCloseOutline size={24} /> : <IoMenuOutline size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden flex flex-col pt-24 px-6 animate-fade-in">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 text-lg font-medium text-zinc-800 bg-zinc-50 rounded-2xl border border-zinc-100 active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 border border-zinc-100">
                  {link.icon}
                </div>
                {link.name}
              </Link>
            ))}
            <div className="pt-6">
              <LoginButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;