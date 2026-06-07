"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Utensils,
    Users,
    ReceiptText,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    HelpCircle,
    Search,
    Menu,
    X,
} from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [adminName, setAdminName] = useState("Super Admin Booking Resto");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                if (userData.name) setAdminName(userData.name);
            } catch (e) {
                console.error("Gagal mengambil nama admin");
            }
        }
    }, []);

    const menuItems = [
        {
            name: "Dashboard",
            path: "/superadmin/dashboard",
            icon: LayoutDashboard,
        },
        { name: "Restoran", path: "/superadmin/restoran", icon: Utensils },
        { name: "User", path: "/superadmin/user", icon: Users },
        { name: "Transaksi", path: "/superadmin/transaksi", icon: ReceiptText },
        { name: "Laporan", path: "/superadmin/laporan", icon: BarChart3 },
        { name: "Pengaturan", path: "/superadmin/pengaturan", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-[#FAF5F2] font-['Plus_Jakarta_Sans'] text-[#1E1B18]">
            {/* OVERLAY MOBILE BACKGROUND */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[280px] flex-col justify-between border-r border-[#E9E1DC] bg-white px-6 py-8 transition-transform duration-300 md:static md:flex md:translate-x-0 ${isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden md:flex"}`}
            >
                <div className="space-y-8">
                    {/* Brand Logo & Mobile Close Button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-[#50281A]">
                                Booking Resto Admin
                            </h1>
                            <p className="text-xs text-[#84746E] mt-0.5 font-medium">
                                Management Console
                            </p>
                        </div>
                        <button
                            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        router.push(item.path);
                                        setIsSidebarOpen(false); // Tutup sidebar otomatis di mobile setelah klik menu
                                    }}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? "bg-[#F5ECE7] text-[#50281A] shadow-sm"
                                            : "text-[#84746E] hover:bg-gray-50 hover:text-[#1E1B18]"
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        className={
                                            isActive
                                                ? "text-[#50281A]"
                                                : "text-[#84746E]"
                                        }
                                    />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => {
                        // 1. Hapus KTP Digital dari browser
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");

                        // 2. Baru arahkan ke halaman login
                        router.push("/login");
                    }}
                    className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-[#93000A] hover:bg-[#FFDAD6]/40 transition-colors w-full mt-8 md:mt-0"
                >
                    <LogOut size={18} />
                    Keluar (Logout)
                </button>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-[76px] bg-white border-b border-[#E9E1DC] px-4 md:px-8 flex items-center justify-between shrink-0">
                    {/* Mobile Hamburger & Search */}
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>

                        {/* 🔄 GANTI INPUT SEARCH LAMA DENGAN TEKS SAPAAN INI 🔄 */}
                        <div className="hidden md:block">
                            <h2 className="text-sm md:text-base font-medium text-[#84746E]">
                                Selamat Datang,{" "}
                                <span className="font-bold text-[#50281A]">
                                    {adminName}
                                </span>{" "}
                            </h2>
                        </div>
                    </div>

                    {/* Right Controls */}
                    {/* Right Controls */}
                    <div className="flex items-center gap-3 md:gap-5">
                        <span className="hidden md:inline-block text-sm font-bold text-[#50281A] bg-[#F5ECE7] px-3 py-1 rounded-full">
                            Super Admin
                        </span>

                        {/* <button className="text-gray-500 hover:text-gray-800 relative p-1.5 rounded-full hover:bg-gray-100">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-[#93000A] rounded-full"></span>
                        </button> 
                        */}

                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#50281A] text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-sm">
                            SA
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
