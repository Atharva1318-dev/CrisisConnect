import React from 'react';
import { ShieldAlert, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white">
                            <ShieldAlert className="text-red-600" size={24} />
                            <span className="text-xl font-bold">CrisisConnect</span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                            Empowering communities with real-time crisis response, AI-driven coordination, and rapid resource allocation.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Platform</h3>
                        <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <li><a href="#" className="hover:text-red-600 transition-colors">Live Map</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Report Incident</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Agency Portal</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Volunteer</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Support</h3>
                        <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <li><a href="#" className="hover:text-red-600 transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Safety Guidelines</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Emergency Contacts</a></li>
                            <li><a href="#" className="hover:text-red-600 transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <li className="flex items-center gap-2">
                                <Mail size={16} /> support@crisisconnect.org
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={16} /> +1 (800) 123-4567
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin size={16} /> Mumbai, India
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-zinc-400">
                        © {new Date().getFullYear()} CrisisConnect. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-zinc-400 hover:text-blue-600 transition-colors"><Facebook size={20} /></a>
                        <a href="#" className="text-zinc-400 hover:text-sky-500 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="text-zinc-400 hover:text-pink-600 transition-colors"><Instagram size={20} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;