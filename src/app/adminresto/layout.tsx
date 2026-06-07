"use client";

import { useState } from "react";
import { useEffect } from "react"; 
import {
    LayoutDashboard,
    CalendarDays,
    Grid2x2,
    Utensils,
    BarChart3,
    User,
    PlusCircle,
    Search,
    Bell,
    Menu,
    X,
    LogOut, 
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminRestoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter(); 

    //  1. SUNTIKAN STATE NAMA RESTORAN 
    const [restaurantName, setRestaurantName] = useState("");

    useEffect(() => {
        const fetchNamaResto = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // Kita pinjam API profil yang sudah ada untuk ambil namanya
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profil`, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (data.success && data.data) {
                    setRestaurantName(data.data.name);
                }
            } catch (error) {
                console.error("Gagal memuat nama restoran", error);
            }
        };

        fetchNamaResto();
    }, []);

    // Fungsi otomatis untuk ngecek halaman mana yang sedang aktif
    const isActive = (path: string) => pathname.includes(path);

    // Fungsi Logout
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            // Nembak API Logout Laravel
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
        } catch (error) {
            console.error("Gagal logout dari server", error);
        } finally {
            // Bersihkan brankas browser dan tendang ke halaman login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFCFB] font-['Inter']">
            {/* OVERLAY MOBILE SIDEBAR (Muncul hanya di HP saat menu diklik) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[#E5E1D9] bg-[#FDFCFB] shadow-[4px_0_24px_rgba(107,62,46,0.04)] transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex h-full flex-col justify-between p-6">
                    <div>
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E]">
                                    RestoManager
                                </h1>
                                <p className="text-sm font-semibold tracking-wide text-[#52443F]">
                                    Admin Panel
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="md:hidden"
                            >
                                <X className="text-[#6B3E2E]" size={24} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/adminresto/dashboard"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/dashboard") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <LayoutDashboard size={20} /> Dashboard
                            </Link>
                            <Link
                                href="/adminresto/reservasi"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/reservasi") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <CalendarDays size={20} /> Reservasi
                            </Link>
                            <Link
                                href="/adminresto/meja"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/meja") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <Grid2x2 size={20} /> Meja
                            </Link>
                            <Link
                                href="/adminresto/menu"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/menu") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <Utensils size={20} /> Menu
                            </Link>
                            <Link
                                href="/adminresto/laporan"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/laporan") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <BarChart3 size={20} /> Laporan
                            </Link>
                            <Link
                                href="/adminresto/profil"
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive("/profil") ? "border-l-4 border-[#6B3E2E] bg-[#F5F1E9] text-[#6B3E2E] font-bold" : "text-[#78716C] hover:bg-[#F5F1E9]/50 hover:text-[#52443F]"}`}
                            >
                                <User size={20} /> Profil
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            >
                                <LogOut size={20} /> Keluar (Logout)
                            </button>
                        </nav>
                    </div>
                </div>
            </aside>

            {/* CONTAINER KONTEN UTAMA */}
            <div className="flex w-full flex-1 flex-col overflow-hidden">
                {/* TOP BAR */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E1D9] bg-[#FDFCFB]/80 px-6 backdrop-blur-md">
                    {/* BAGIAN KIRI: Tombol Menu Mobile & Sapaan Admin */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="rounded-lg p-2 text-[#52443F] hover:bg-[#F5F1E9] md:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Sapaan untuk layar Tablet/Laptop (Lengkap) */}
                        <div className="hidden sm:block">
                            <p className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-[#78716C]">
                                Selamat datang,{" "}
                                <span className="font-bold text-[#6B3E2E]">
                                    Admin Resto {restaurantName}
                                </span>
                            </p>
                        </div>

                        {/* Sapaan untuk layar HP (Disingkat biar tidak menabrak tombol) */}
                        <div className="block sm:hidden">
                            <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#6B3E2E]">
                                {restaurantName || "Admin Resto"}
                            </p>
                        </div>
                    </div>

                    {/* BAGIAN KANAN: Lonceng Notif & Avatar */}
                    <div className="flex items-center gap-4">
                        <button className="rounded-full p-2 text-[#78716C] transition hover:bg-[#F5F1E9] hover:text-[#6B3E2E]">
                            <Bell size={20} />
                        </button>
                        {/* Avatar dinamis mengambil huruf pertama nama restoran */}
                        <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#50281A] text-sm font-bold text-white shadow-sm transition hover:bg-[#6B3E2E]">
                            {restaurantName
                                ? restaurantName.charAt(0).toUpperCase()
                                : "A"}
                        </div>
                    </div>
                </header>

                {/* TEMPAT KONTEN HALAMAN MAJU (Disuntik ke children) */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
