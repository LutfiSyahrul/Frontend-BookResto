"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

export default function CustomerLandingPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [restaurants, setRestaurants] = useState<any[]>([]);

    const [user, setUser] = useState<any>(null); // State untuk menyimpan data profil

    // STATE UNTUK AI CHATBOT
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([
        {
            role: "ai",
            text: "Halo! Saya Asisten AI Booking Resto. Ada yang bisa saya bantu untuk mencari restoran atau rekomendasi menu hari ini?",
        },
    ]);

    // ================= LOGIKA HEADER & FETCH DATA DINAMIS =================
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            // [RADAR PENGAMAN DIMULAI] =============================
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    const userRole = userData.role;

                    // Tendang Super Admin dan Admin Resto yang nyasar ke halaman publik!
                    if (userRole === "superadmin") {
                        router.push("/superadmin/dashboard");
                        return; // Hentikan eksekusi kode di bawahnya
                    } else if (userRole === "adminresto") {
                        router.push("/adminresto/dashboard");
                        return; // Hentikan eksekusi kode di bawahnya
                    }
                } catch (e) {
                    console.error("Gagal membaca data session", e);
                }
            }

            setIsLoggedIn(true);
            // Tambahkan fetch data user:
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setUser(data))
                .catch((err) => console.error("Gagal ambil user", err));
        }

        // Fungsi narik data restoran dari backend (Sekarang cuma ada satu!)
        const fetchRestaurants = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/restaurants`,
                );
                const data = await response.json();

                if (data.success) {
                    // Deteksi bentuk data dari Laravel
                    let restArray = [];
                    if (Array.isArray(data.data)) {
                        restArray = data.data;
                    } else if (data.data && Array.isArray(data.data.data)) {
                        restArray = data.data.data;
                    }

                    // Potong ambil 3 teratas
                    setRestaurants(restArray.slice(0, 3));
                }
            } catch (error) {
                console.error("Gagal mengambil data restoran:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurants();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        router.refresh();
    };

    // FUNGSI KIRIM PESAN AI
    // FUNGSI KIRIM PESAN AI (VERSI TERHUBUNG API LARAVEL) - PENTING! JANGAN DIHAPUS!
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userText = chatInput;
        // Masukkan chat user ke layar
        setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
        setChatInput("");

        // Tampilkan indikator AI sedang berpikir
        setChatMessages((prev) => [
            ...prev,
            { role: "ai", text: "Sedang memikirkan rekomendasi terbaik..." },
        ]);

        try {
            // Tembak ke API Laravel bosku
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chatbot/ask`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ message: userText }),
                },
            );

            const res = await response.json();

            // Ganti teks "berpikir" dengan jawaban asli dari AI
            setChatMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages.pop(); // membuang teks indikator berpikir
                updatedMessages.push({
                    role: "ai",
                    // [INI YANG KITA SENSOR]
                    text: res.success
                        ? res.data
                        : res.message ||
                          "Waduh Kak, aku lagi pusing nih. Coba lagi nanti ya! 🙏",
                });
                return updatedMessages;
            });
        } catch (error) {
            setChatMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages.pop();
                updatedMessages.push({
                    role: "ai",
                    text: "",
                });
                return updatedMessages;
            });
        }
    };

    // --- VARIABEL ANIMASI 60FPS ---
    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" },
        },
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
    };

    // Mencegah konten muncul sebelum status login terdeteksi
    if (isLoading) return <div className="min-h-screen bg-[#FFF8F5]" />;

    return (
        <main className="relative min-h-screen w-full bg-gradient-to-t from-[#FFF8F5] to-white overflow-hidden">
            {/* ================= NAVBAR (HEADER DINAMIS) ================= */}
            <header className="fixed top-0 z-50 flex h-[72px] w-full items-center justify-center border-b border-stone-200/60 bg-[#FDFCFB]/80 px-6 backdrop-blur-md transition-all sm:px-10">
                <div className="flex w-full max-w-[1200px] items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/beranda"
                        className="font-['Inter'] text-xl font-bold tracking-tight text-[#6B3E2E] md:text-2xl"
                    >
                        Booking Resto
                    </Link>

                    {/* KONDISI 1: HEADER UNTUK USER YANG SUDAH LOGIN */}
                    {isLoggedIn ? (
                        <>
                            <nav className="hidden items-center gap-2 md:flex lg:gap-8">
                                <Link
                                    href="/beranda"
                                    className="border-b-2 border-[#6B3E2E] pb-1 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#6B3E2E]"
                                >
                                    Eksplorasi
                                </Link>
                                <Link
                                    href="/reservasi"
                                    className="rounded-lg px-3 py-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] transition hover:bg-stone-100 hover:text-[#6B3E2E]"
                                >
                                    Reservasi Saya
                                </Link>
                                <Link
                                    href="/favorit"
                                    className="rounded-lg px-3 py-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] transition hover:bg-stone-100 hover:text-[#6B3E2E]"
                                >
                                    Favorit
                                </Link>
                            </nav>

                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* ================= AVATAR DENGAN SISTEM KLIK ================= */}
                                <div className="relative ml-2">
                                    <button
                                        onClick={() =>
                                            setIsDropdownOpen(!isDropdownOpen)
                                        }
                                        className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 shadow-sm transition hover:ring-2 hover:ring-[#6B3E2E]"
                                    >
                                        {user?.avatar_url ? (
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${user.avatar_url}`}
                                                alt="Profil"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[#6B3E2E] text-white font-bold text-sm">
                                                {user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "U"}
                                            </div>
                                        )}
                                    </button>

                                    {/* Menu Dropdown Avatar */}
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-lg z-50">
                                            <Link
                                                href="/profil"
                                                onClick={() =>
                                                    setIsDropdownOpen(false)
                                                }
                                                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#52443F] transition hover:bg-[#F5F1E9]"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                                Profil Saya
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Keluar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 🔄 TAMBAHAN: TOMBOL HAMBURGER KHUSUS MOBILE 🔄 */}
                                <button
                                    onClick={() =>
                                        setIsMobileMenuOpen(!isMobileMenuOpen)
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5ECE7] text-[#6B3E2E] transition-colors hover:bg-[#D6C2BC] md:hidden"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        {isMobileMenuOpen ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        /* KONDISI 2: HEADER UNTUK TAMU (GUEST MODE) */
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="rounded-full px-5 py-2 text-sm font-bold text-[#50281A] transition-colors hover:bg-[#F4F1EC]"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full bg-[#50281A] px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#3d1e14] hover:shadow-md active:scale-95"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>

                {/* 🔄 TAMBAHAN: PANEL MENU DROPDOWN KHUSUS MOBILE 🔄 */}
                {isMobileMenuOpen && isLoggedIn && (
                    <div className="absolute left-0 top-[72px] w-full border-b border-stone-200 bg-white p-4 shadow-lg md:hidden">
                        <nav className="flex flex-col gap-4">
                            <Link
                                href="/beranda"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#6B3E2E]"
                            >
                                Eksplorasi
                            </Link>
                            <Link
                                href="/reservasi"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#78716C] transition hover:text-[#6B3E2E]"
                            >
                                Reservasi Saya
                            </Link>
                            <Link
                                href="/favorit"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#78716C] transition hover:text-[#6B3E2E]"
                            >
                                Favorit
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* ================= HERO SECTION (ANIMASI 60FPS) ================= */}
            <section className="relative mt-[72px] flex w-full flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 sm:pt-32 lg:h-[600px] lg:pt-0">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/bg-beranda.png"
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-[#FFF8F5]/80 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFF8F5] via-[#FFF8F5]/0 to-[#FFF8F5]/0" />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="relative z-10 flex w-full max-w-[1200px] flex-col items-center gap-6 text-center"
                >
                    <motion.h1
                        variants={fadeInUp}
                        className="max-w-[768px] font-['Plus_Jakarta_Sans'] text-4xl font-bold leading-tight text-[#1E1B18] md:text-5xl lg:text-[48px] lg:leading-[56px]"
                    >
                        Reservasi Meja Restoran Jadi Lebih Mudah
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        className="max-w-[672px] font-['Inter'] text-base text-[#52443F] md:text-lg"
                    >
                        Temukan dan pesan meja di restoran terbaik dengan
                        pengalaman yang mulus. Ciptakan momen kuliner tak
                        terlupakan dalam beberapa sentuhan.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="pt-4">
                        <Link
                            href={isLoggedIn ? "/eksplorasi" : "/login"}
                            className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-[#50281A] px-8 text-white shadow-[0px_4px_20px_-4px_rgba(80,40,26,0.15)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#3d1e14] hover:shadow-xl"
                        >
                            <span className="font-['Inter'] text-sm font-semibold tracking-wide">
                                Mulai Reservasi
                            </span>
                            <div
                                className="h-2.5 w-2.5 bg-white transition-transform group-hover:translate-x-1"
                                style={{
                                    WebkitMaskImage:
                                        "url('/icons/arrow-right.svg')",
                                    WebkitMaskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    maskImage: "url('/icons/arrow-right.svg')",
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                }}
                            />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* ================= REKOMENDASI SECTION ================= */}
            <section className="flex w-full flex-col items-center px-6 py-16 sm:px-10 lg:py-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="flex w-full max-w-[1200px] flex-col gap-12"
                >
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-[#1E1B18] md:text-3xl">
                                Rekomendasi Restoran
                            </h2>
                            <p className="font-['Inter'] text-base text-[#52443F]">
                                Kurasi eksklusif untuk pengalaman bersantap Anda
                            </p>
                        </div>
                        <Link
                            href={isLoggedIn ? "/eksplorasi" : "/login"}
                            className="group flex items-center gap-1 text-[#50281A] transition hover:opacity-80"
                        >
                            <span className="font-['Inter'] text-sm font-semibold tracking-wide">
                                Lihat Semua
                            </span>
                            <div
                                className="h-2 w-2.5 bg-[#50281A] transition-transform group-hover:translate-x-1"
                                style={{
                                    maskImage: "url(/icons/arrow-right.svg)",
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                }}
                            />
                        </Link>
                    </motion.div>

                    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* LOOPING DATA RESTORAN DINAMIS */}
                        {restaurants.map((resto) => (
                            <motion.div
                                key={resto.id}
                                variants={fadeInUp}
                                onClick={() =>
                                    router.push(`/restoran/${resto.id}`)
                                } // Biar kartunya bisa diklik masuk ke detail
                                className="group cursor-pointer overflow-hidden rounded-2xl border border-[#D6C2BC] bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div className="relative h-48 w-full overflow-hidden">
                                    {/* GAMBAR DINAMIS SINKRON DENGAN STORAGE */}
                                    <img
                                        src={
                                            resto.image_url
                                                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${resto.image_url}`
                                                : "https://placehold.co/600x400?text=Belum+Ada+Foto"
                                        }
                                        alt={resto.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 p-6">
                                    <div className="flex gap-2 pb-2">
                                        <span className="rounded-full bg-[#F5ECE7] px-3 py-1 font-['Inter'] text-xs font-semibold tracking-wide text-[#6B3E2E]">
                                            {resto.category || "Umum"}
                                        </span>

                                        {/* Mendeteksi teks 'buka' dari database*/}
                                        <span className="rounded-full bg-[#F5ECE7] px-3 py-1 font-['Inter'] text-xs font-semibold tracking-wide text-[#6B3E2E] capitalize">
                                            {resto.status?.toLowerCase() ===
                                                "buka" ||
                                            resto.status?.toLowerCase() ===
                                                "open"
                                                ? "Buka"
                                                : "Tutup"}
                                        </span>
                                    </div>

                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18] transition-colors group-hover:text-[#6B3E2E] line-clamp-1">
                                        {resto.name}
                                    </h3>

                                    <div className="flex items-center gap-1.5 text-[#52443F]">
                                        {/* INI ICON LOKASI BARUNYA (GANTI KOTAK ABU-ABU) */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 flex-shrink-0 text-[#605E58]"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        <span className="font-['Inter'] text-sm line-clamp-1">
                                            {resto.address ||
                                                "Alamat belum ditambahkan"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ================= CARA KERJA SECTION ================= */}
            <section className="flex w-full flex-col items-center border-y border-[#E9E1DC] bg-[#FBF2ED] px-6 py-16 sm:px-10 lg:py-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="flex w-full max-w-[1200px] flex-col items-center gap-12"
                >
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col items-center gap-2 text-center"
                    >
                        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-[#1E1B18] md:text-3xl">
                            Cara Kerja
                        </h2>
                        <p className="font-['Inter'] text-base text-[#52443F]">
                            Proses sederhana untuk memastikan meja Anda selalu
                            siap
                        </p>
                    </motion.div>

                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col items-center rounded-2xl border border-[#D6C2BC] bg-white p-8 text-center shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6E2DA]">
                                <svg
                                    width="23"
                                    className="h-7 w-7 text-[#6B3E2E]"
                                    height="23"
                                    viewBox="0 0 23 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M20.75 22.5L12.875 14.625C12.25 15.125 11.5312 15.5208 10.7188 15.8125C9.90625 16.1042 9.04167 16.25 8.125 16.25C5.85417 16.25 3.93229 15.4635 2.35938 13.8906C0.786458 12.3177 0 10.3958 0 8.125C0 5.85417 0.786458 3.93229 2.35938 2.35938C3.93229 0.786458 5.85417 0 8.125 0C10.3958 0 12.3177 0.786458 13.8906 2.35938C15.4635 3.93229 16.25 5.85417 16.25 8.125C16.25 9.04167 16.1042 9.90625 15.8125 10.7188C15.5208 11.5312 15.125 12.25 14.625 12.875L22.5 20.75L20.75 22.5ZM8.125 13.75C9.6875 13.75 11.0156 13.2031 12.1094 12.1094C13.2031 11.0156 13.75 9.6875 13.75 8.125C13.75 6.5625 13.2031 5.23438 12.1094 4.14062C11.0156 3.04688 9.6875 2.5 8.125 2.5C6.5625 2.5 5.23438 3.04688 4.14062 4.14062C3.04688 5.23438 2.5 6.5625 2.5 8.125C2.5 9.6875 3.04688 11.0156 4.14062 12.1094C5.23438 13.2031 6.5625 13.75 8.125 13.75Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18]">
                                1. Eksplorasi
                            </h3>
                            <p className="font-['Inter'] text-sm text-[#52443F]">
                                Temukan restoran terbaik berdasarkan lokasi,
                                masakan, dan suasana hati Anda.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col items-center rounded-2xl border border-[#D6C2BC] bg-white p-8 text-center shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6E2DA]">
                                <svg
                                    width="23"
                                    className="h-7 w-7 text-[#6B3E2E]"
                                    height="25"
                                    viewBox="0 0 23 25"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M2.5 25C1.8125 25 1.22396 24.7552 0.734375 24.2656C0.244792 23.776 0 23.1875 0 22.5V5C0 4.3125 0.244792 3.72396 0.734375 3.23438C1.22396 2.74479 1.8125 2.5 2.5 2.5H3.75V0H6.25V2.5H16.25V0H18.75V2.5H20C20.6875 2.5 21.276 2.74479 21.7656 3.23438C22.2552 3.72396 22.5 4.3125 22.5 5V22.5C22.5 23.1875 22.2552 23.776 21.7656 24.2656C21.276 24.7552 20.6875 25 20 25H2.5ZM2.5 22.5H20V10H2.5V22.5ZM2.5 7.5H20V5H2.5V7.5ZM2.5 7.5V5V7.5Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18]">
                                2. Pilih Waktu & Meja
                            </h3>
                            <p className="font-['Inter'] text-sm text-[#52443F]">
                                Tentukan tanggal, jam, dan pilih area tempat
                                duduk favorit Anda melalui denah interaktif.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col items-center rounded-2xl border border-[#D6C2BC] bg-white p-8 text-center shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6E2DA]">
                                <svg
                                    width="25"
                                    className="h-7 w-7 text-[#6B3E2E]"
                                    height="25"
                                    viewBox="0 0 25 25"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M10.75 18.25L19.5625 9.4375L17.8125 7.6875L10.75 14.75L7.1875 11.1875L5.4375 12.9375L10.75 18.25ZM12.5 25C10.7708 25 9.14583 24.6719 7.625 24.0156C6.10417 23.3594 4.78125 22.4688 3.65625 21.3438C2.53125 20.2188 1.64062 18.8958 0.984375 17.375C0.328125 15.8542 0 14.2292 0 12.5C0 10.7708 0.328125 9.14583 0.984375 7.625C1.64062 6.10417 2.53125 4.78125 3.65625 3.65625C4.78125 2.53125 6.10417 1.64062 7.625 0.984375C9.14583 0.328125 10.7708 0 12.5 0C14.2292 0 15.8542 0.328125 17.375 0.984375C18.8958 1.64062 20.2188 2.53125 21.3438 3.65625C22.4688 4.78125 23.3594 6.10417 24.0156 7.625C24.6719 9.14583 25 10.7708 25 12.5C25 14.2292 24.6719 15.8542 24.0156 17.375C23.3594 18.8958 22.4688 20.2188 21.3438 21.3438C20.2188 22.4688 18.8958 23.3594 17.375 24.0156C15.8542 24.6719 14.2292 25 12.5 25ZM12.5 22.5C15.2917 22.5 17.6562 21.5312 19.5938 19.5938C21.5312 17.6562 22.5 15.2917 22.5 12.5C22.5 9.70833 21.5312 7.34375 19.5938 5.40625C17.6562 3.46875 15.2917 2.5 12.5 2.5C9.70833 2.5 7.34375 3.46875 5.40625 5.40625C3.46875 7.34375 2.5 9.70833 2.5 12.5C2.5 15.2917 3.46875 17.6562 5.40625 19.5938C7.34375 21.5312 9.70833 22.5 12.5 22.5Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18]">
                                3. Konfirmasi Instan
                            </h3>
                            <p className="font-['Inter'] text-sm text-[#52443F]">
                                Reservasi Anda langsung terkonfirmasi. Siap
                                untuk menikmati pengalaman bersantap yang luar
                                biasa.
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ================= FITUR PREMIUM SECTION (DENGAN DENAH MELAYANG) ================= */}
            <section className="flex w-full flex-col items-center px-6 py-16 sm:px-10 lg:py-24">
                <div className="flex w-full max-w-[1200px] flex-col items-center gap-12 lg:flex-row lg:justify-between">
                    {/* Teks Sebelah Kiri */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex w-full flex-col items-start gap-6 lg:w-1/2"
                    >
                        <span className="font-['Inter'] text-xs font-semibold tracking-[1.40px] text-[#50281A] md:text-sm">
                            FITUR PREMIUM
                        </span>
                        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight text-[#1E1B18] md:text-4xl lg:text-[48px] lg:leading-[60px]">
                            Pilih Meja Ideal Anda
                            <br className="hidden md:block" /> dengan Denah
                            Interaktif
                        </h2>
                        <p className="font-['Inter'] text-base leading-relaxed text-[#52443F] md:text-lg">
                            Bukan sekadar reservasi biasa. Platform kami
                            memberikan kebebasan penuh bagi Anda untuk memilih
                            meja favorit secara visual. Apakah Anda menginginkan
                            sudut privat yang romantis, atau meja dekat jendela
                            dengan pemandangan kota? Semua dalam kendali Anda.
                        </p>
                        <ul className="flex flex-col gap-4 pt-2">
                            <li className="flex items-center gap-3">
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-[#50281A]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-['Inter'] text-base text-[#52443F]">
                                    Visualisasi tata letak restoran secara
                                    real-time
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-[#50281A]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-['Inter'] text-base text-[#52443F]">
                                    Indikator ketersediaan meja instan
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-[#50281A]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-['Inter'] text-base text-[#52443F]">
                                    Pilihan preferensi area (Indoor, Outdoor,
                                    Bar)
                                </span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Gambar Denah Sebelah Kanan (Melayang 60fps) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            bounce: 0.4,
                        }}
                        className="relative flex w-full justify-center lg:w-5/12"
                    >
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            whileHover={{ scale: 1.03 }}
                            className="relative w-full max-w-[486px] overflow-hidden rounded-3xl border border-[#D6C2BC] bg-[#F5ECE7] p-4 shadow-xl md:p-6 lg:h-[536px] cursor-pointer"
                        >
                            {/* <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-inner">
                                <Image
                                    src="/Denah-Interaktif.png"
                                    alt="Denah Interaktif"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF8F5]/50 to-transparent" />
                            </div> */}

                            <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-inner">
                                {/* ================= VIDEO DENAH INTERAKTIF ================= */}
                                <motion.video
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 1.5,
                                        ease: "easeOut",
                                    }} // Muncul perlahan selama 1.5 detik
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                >
                                    <source
                                        src="/animasi-denah.mp4"
                                        type="video/mp4"
                                    />
                                    Browser Anda tidak mendukung tag video.
                                </motion.video>

                                {/* Overlay Gradient tetap dipertahankan agar teks di atasnya tetap terbaca */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF8F5]/50 to-transparent" />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="flex w-full flex-col items-center border-t border-stone-300 bg-[#F5F1E9] px-6 py-12 sm:px-10">
                <div className="flex w-full max-w-[1200px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                    <div className="flex flex-col gap-2">
                        <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E]">
                            Booking Resto
                        </span>
                        <p className="font-['Plus_Jakarta_Sans'] text-sm text-[#57534E]">
                            © 2026 Booking Resto. Keanggunan dalam setiap
                            reservasi.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                        <Link
                            href="/tentang-kami"
                            className="font-['Plus_Jakarta_Sans'] text-sm text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Tentang Kami
                        </Link>
                        <Link
                            href="/bantuan"
                            className="font-['Plus_Jakarta_Sans'] text-sm text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Pusat Bantuan
                        </Link>
                        <Link
                            href="/syarat"
                            className="font-['Plus_Jakarta_Sans'] text-sm text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Syarat & Ketentuan
                        </Link>
                        <Link
                            href="/privasi"
                            className="font-['Plus_Jakarta_Sans'] text-sm text-[#78716C] transition hover:text-[#6B3E2E]"
                        >
                            Kebijakan Privasi
                        </Link>
                    </div>
                </div>
            </footer>

            {/* WIDGET AI CHATBOT */}
            <div className="fixed bottom-6 right-6 z-[99] flex flex-col items-end">
                {/* Kotak Chat (Muncul jika tombol diklik) */}
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 flex flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl sm:w-[380px] sm:h-[500px] fixed sm:relative inset-0 sm:inset-auto z-[100] sm:z-auto h-full w-full"
                    >
                        {/* Header Chat */}
                        <div className="flex items-center justify-between bg-[#50281A] px-5 py-4 text-white sm:rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                                <span className="font-['Plus_Jakarta_Sans'] font-bold">
                                    Asisten Kuliner AI
                                </span>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Area Pesan Obrolan */}
                        <div className="flex-1 overflow-y-auto bg-[#FBF2ED] p-4 flex flex-col gap-3 custom-scrollbar">
                            {chatMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm font-['Inter'] shadow-sm ${msg.role === "user" ? "bg-[#50281A] text-white rounded-br-none" : "bg-white text-[#52443F] border border-[#E9E1DC] rounded-bl-none"}`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Area Input Ketikan */}
                        <div className="border-t border-[#E9E1DC] bg-white p-3 sm:rounded-b-2xl pb-6 sm:pb-3">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) =>
                                        setChatInput(e.target.value)
                                    }
                                    placeholder="Tanya rekomendasi restoran..."
                                    className="w-full rounded-xl border border-[#D6C2BC] bg-[#F5ECE7]/50 px-4 py-3 sm:py-2.5 text-sm font-['Inter'] focus:border-[#50281A] focus:outline-none focus:ring-1 focus:ring-[#50281A]"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="flex h-11 w-11 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#50281A] text-white transition hover:bg-[#3d1e14] disabled:opacity-50"
                                >
                                    <svg
                                        className="h-4 w-4 relative right-[1px]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Tombol AI Melayang (Sparkles) */}
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#50281A] text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#3d1e14]"
                    >
                        <svg
                            className="h-7 w-7 transition-transform group-hover:rotate-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </main>
    );
}
