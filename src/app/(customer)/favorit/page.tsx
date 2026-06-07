"use client";

import { useState, useEffect } from "react";
import {
    Trash2,
    MapPin,
    Star,
    ArrowRight,
    Utensils,
    Heart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";

export default function FavoritPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [favorites, setFavorites] = useState<any[]>([]);

    // AMBIL DATA DARI DATABASE SAAT HALAMAN DIBUKA
    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }
            setIsLoggedIn(true);

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    },
                );
                const result = await response.json();

                if (result.success) {
                    setFavorites(result.data); // Simpan data asli ke state
                }
            } catch (error) {
                console.error("Gagal mengambil data favorit:", error);
            } finally {
                setTimeout(() => setIsLoading(false), 300);
            }
        };

        fetchFavorites();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    // FUNGSI HAPUS (OPTIMISTIC UI & HAPUS DI DB)
    const removeFavorite = async (id: number) => {
        // 1. Hapus instan di layar biar terasa cepat
        setFavorites(favorites.filter((item: any) => item.id !== id));

        // 2. Hapus secara permanen di database backend
        const token = localStorage.getItem("token");
        if (token) {
            try {
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/favorites/${id}/toggle`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    },
                );
            } catch (error) {
                console.error("Gagal menghapus dari database", error);
            }
        }
    };

    // ================= SISTEM ANIMASI 120FPS (PHYSICS BASED) =================

    // 1. Animasi Masuk Halaman (Slide Up & Fade)
    const pageVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100, // Kekakuan pegas
                damping: 20, // Redaman agar tidak goyang berlebihan
                staggerChildren: 0.1, // Memberikan efek 'air terjun' antar kartu
                delayChildren: 0.2,
            },
        },
    };

    // 2. Animasi Kartu (Pop in dengan sedikit pantulan)
    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3 },
        },
    };

    if (isLoading) return <div className="min-h-screen bg-[#FDFCFB]" />;

    return (
        <main className="min-h-screen bg-[#FDFCFB] overflow-x-hidden">
            {/* HEADER DINAMIS (Tetap konsisten) */}
            {/* ================= HEADER (FONT SYNCED WITH BERANDA) ================= */}
            <header className="fixed top-0 z-50 flex h-[72px] w-full items-center justify-center border-b border-stone-200/60 bg-[#FDFCFB]/80 px-6 backdrop-blur-md sm:px-10">
                <div className="flex w-full max-w-[1200px] items-center justify-between">
                    {/* Logo tetap pakai Inter/Plus Jakarta (Bold) */}
                    <Link
                        href="/beranda"
                        className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-tight text-[#6B3E2E] md:text-2xl"
                    >
                        Booking Resto
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {/* Link Navigasi - Sekarang pakai Plus Jakarta Sans + Semibold */}
                        <Link
                            href="/beranda"
                            className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Eksplorasi
                        </Link>
                        <Link
                            href="/reservasi"
                            className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Reservasi Saya
                        </Link>

                        {/* Menu Aktif (Favorit) - Pakai Plus Jakarta Sans + Bold */}
                        <div className="relative flex flex-col items-center">
                            <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#6B3E2E]">
                                Favorit
                            </span>
                            <div className="absolute -bottom-[27px] h-[3px] w-full rounded-t-full bg-[#6B3E2E]"></div>
                        </div>
                    </nav>
                </div>
            </header>

            {/* AREA CONTENT DENGAN WRAPPER ANIMASI */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={pageVariants}
                className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-32 sm:px-10"
            >
                <motion.div variants={itemVariants} className="mb-10">
                    <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold tracking-tight text-[#1E1B18]">
                        Favorit Saya
                    </h1>
                    <p className="mt-2 font-['Inter'] text-base text-[#52443F]">
                        Simpan dan atur tempat bersantap impian Anda.
                    </p>
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {favorites.length > 0 ? (
                        <motion.div
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                            layout // Memicu re-ordering kartu yang mulus saat ada yang dihapus
                        >
                            {favorites.map((resto: any) => {
                                // Pengecekan URL Gambar Asli
                                const imageUrl = resto.image?.startsWith("http")
                                    ? resto.image
                                    : resto.image
                                      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${resto.image}`
                                      : "https://placehold.co/600x400?text=Gambar+Restoran";

                                return (
                                    <motion.div
                                        key={resto.id}
                                        variants={itemVariants}
                                        exit="exit"
                                        layout
                                        className="group relative overflow-hidden rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm transition-all hover:shadow-xl will-change-transform"
                                    >
                                        {/* Image Container */}
                                        <div className="relative h-56 w-full overflow-hidden rounded-[20px]">
                                            {/* Ganti <Image> pakai <img> biasa agar tidak error membaca URL eksternal */}
                                            <img
                                                src={imageUrl}
                                                alt={resto.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />

                                            {/* Button Hapus */}
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() =>
                                                    removeFavorite(resto.id)
                                                }
                                                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </motion.button>

                                            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md">
                                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs font-bold text-white">
                                                    {resto.rating || "0"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="px-3 py-5">
                                            <div className="flex items-center gap-2">
                                                <Utensils className="h-3.5 w-3.5 text-[#6B3E2E]" />
                                                <span className="text-[11px] font-bold uppercase tracking-[1px] text-[#6B3E2E]">
                                                    {resto.category || "Umum"}
                                                </span>
                                            </div>
                                            <h3 className="mt-2 font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18] line-clamp-1">
                                                {resto.name}
                                            </h3>
                                            <div className="mt-3 flex items-center gap-2 text-[#78716C]">
                                                <MapPin className="h-4 w-4 shrink-0 text-stone-400" />
                                                <span className="text-sm font-medium line-clamp-1">
                                                    {resto.address ||
                                                        "Lokasi tidak tersedia"}
                                                </span>
                                            </div>

                                            <Link
                                                href={`/restoran/${resto.id}`}
                                                className="mt-6 flex w-full items-center justify-between rounded-2xl bg-[#50281A] px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#3d1e14] hover:shadow-lg active:scale-[0.98]"
                                            >
                                                Lihat Detail
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        /* EMPTY STATE (ANIMASI LEMBUT) */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 text-center"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                    }}
                                    className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F5ECE7]"
                                >
                                    <Heart className="h-10 w-10 text-[#6B3E2E] fill-[#6B3E2E]/10" />
                                </motion.div>
                            </div>
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1E1B18]">
                                Daftar Favorit Masih Kosong
                            </h2>
                            <p className="mt-3 max-w-sm text-base text-[#78716C]">
                                Mulai jelajahi restoran terbaik dan simpan
                                tempat favorit Anda di sini.
                            </p>
                            <Link
                                href="/beranda"
                                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#50281A] px-10 py-4 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
                            >
                                Jelajahi Restoran
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>
        </main>
    );
}
