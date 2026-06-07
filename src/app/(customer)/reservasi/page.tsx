"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Bell,
    Heart,
    Search,
    Calendar,
    Clock,
    Users,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

// Tipe Data
interface ReservationItem {
    id: string;
    restoName: string;
    image: string;
    date: string;
    time: string;
    guests: number;
    status: string;
    snap_token?: string;
}

export default function DaftarReservasiPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<
        "belum bayar" | "mendatang" | "riwayat"
    >("belum bayar");

    // STATE DINAMIS DARI DATABASE
    const [unpaidData, setUnpaidData] = useState<ReservationItem[]>([]); // <--- TAMBAHAN STATE
    const [upcomingData, setUpcomingData] = useState<ReservationItem[]>([]);
    const [pastData, setPastData] = useState<ReservationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // SUNTIKAN SCRIPT MIDTRANS (agar bisa langsung pakai snap.pay di tombol bayar)
    useEffect(() => {
        const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
        // Pastikan ini adalah Client Key untuk SANDBOX (Berawalan SB-)
        // Saya asumsikan key bos: SB-Mid-client-XLPsb-VHk94VEwPU (Sesuai gambar sebelumnya, tapi ditambah SB-)
        const clientKey = "SB-Mid-client-XLPsb-VHk94VEwPU";

        const script = document.createElement("script");
        script.src = snapScript;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);
    // AKHIR SUNTIKAN SCRIPT MIDTRANS

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            // router.push("/login"); // Dimatikan sementara agar bos bisa ngetes tanpa login dulu
        }

        const fetchMyReservations = async () => {
            try {
                // Pastikan token sudah dicek sebelum fetch
                const token = localStorage.getItem("token");

                // Panggil API Laravel DENGAN MEMBAWA TOKEN
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/my-reservations`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data.success) {
                    // memastikan Laravel mengirim 3 array ini nantinya
                    setUnpaidData(response.data.data.unpaid || []);
                    setUpcomingData(response.data.data.upcoming || []);
                    setPastData(response.data.data.past || []);
                }
            } catch (error: any) {
                console.error("Gagal menarik data reservasi:", error);
                if (error.response?.status === 401) {
                    console.error(
                        "Token ditolak! Sesi login mungkin sudah habis.",
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyReservations();
    }, [router]);

    const currentData =
        activeTab === "belum bayar"
            ? unpaidData
            : activeTab === "mendatang"
              ? upcomingData
              : pastData;

    // FUNGSI FORMAT TANGGAL
    const formatDisplayDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch (e) {
            return dateString;
        }
    };

    // Animasi Stagger untuk list kartu
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 },
        },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    return (
        <div className="min-h-screen w-full bg-[#FCFAF8] font-['Inter'] text-[#1E1B18]">
            {/* MAIN HEADER (Mirip Figma) */}
            <nav className="sticky top-0 z-50 flex h-[80px] w-full items-center justify-center border-b border-[#D6C2BC]/30 bg-[#FCFAF8]/80 px-6 backdrop-blur-xl lg:px-10">
                <div className="flex w-full max-w-[1200px] items-center justify-between">
                    <Link
                        href="/beranda"
                        className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]"
                    >
                        Booking Resto
                    </Link>

                    <div className="hidden items-center gap-8 md:flex">
                        <Link
                            href="/eksplorasi"
                            className="text-sm font-medium text-[#78716C] transition-colors hover:text-[#50281A]"
                        >
                            Eksplorasi
                        </Link>
                        <div className="relative flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-[#50281A]">
                                Reservasi Saya
                            </span>
                            <div className="absolute -bottom-[29px] h-[3px] w-full rounded-t-full bg-[#50281A]"></div>
                        </div>
                        <Link
                            href="/favorit"
                            className="text-sm font-medium text-[#78716C] transition-colors hover:text-[#50281A]"
                        >
                            Favorit
                        </Link>
                    </div>

                    {/* <div className="flex items-center gap-5 text-[#50281A]">
                        <button className="transition-transform hover:scale-110">
                            <Bell size={20} />
                        </button>
                        <button className="transition-transform hover:scale-110">
                            <Heart size={20} />
                        </button>
                        <div className="h-9 w-9 cursor-pointer rounded-full bg-[#EBE7E0] transition-transform hover:scale-105 border border-[#D6C2BC]"></div>
                    </div> */}
                </div>
            </nav>

            <main className="mx-auto w-full max-w-[800px] px-6 py-10 lg:py-16">
                {/* Header Konten */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                        Reservasi Saya
                    </h1>
                    <p className="text-[#78716C]">
                        Kelola reservasi mendatang dan riwayat kunjungan Anda.
                    </p>
                </div>

                {/* Tabs Animasi (Belum Bayar, Mendatang & Riwayat) */}
                <div className="mt-10 flex w-full border-b border-[#D6C2BC]/40 overflow-x-auto hide-scrollbar">
                    <div className="flex gap-8">
                        {/* 👇 TAMBAHKAN "belum bayar" DI DALAM ARRAY INI */}
                        {["belum bayar", "mendatang", "riwayat"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`relative pb-4 text-sm font-semibold capitalize whitespace-nowrap transition-colors duration-300 ${activeTab === tab ? "text-[#50281A]" : "text-[#A8A29E] hover:text-[#78716C]"}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 h-[2px] w-full bg-[#50281A]"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Daftar Reservasi */}
                <div className="mt-8 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#50281A]">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D6C2BC] border-t-[#50281A] mb-4"></div>
                            <p className="text-sm font-medium">
                                Memuat data reservasi...
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex flex-col gap-5"
                            >
                                {currentData.length > 0 ? (
                                    currentData.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            variants={itemVariants}
                                            className="group flex flex-col justify-between gap-6 rounded-2xl border border-[#D6C2BC]/40 bg-[#F4F1EC] p-5 transition-all duration-300 hover:border-[#50281A]/30 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                                                    <img
                                                        src={item.image}
                                                        alt={item.restoName}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                                                            {item.restoName}
                                                        </h3>
                                                        <span className="rounded-full bg-[#D6C2BC]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#50281A] border border-[#50281A]/10">
                                                            ID: #{item.id}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#78716C]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar
                                                                size={14}
                                                                className="text-[#A8A29E]"
                                                            />{" "}
                                                            {formatDisplayDate(
                                                                item.date,
                                                            )}
                                                        </div>
                                                        <div className="h-1 w-1 rounded-full bg-[#D6C2BC]"></div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock
                                                                size={14}
                                                                className="text-[#A8A29E]"
                                                            />{" "}
                                                            {item.time} WIB
                                                        </div>
                                                        <div className="h-1 w-1 rounded-full bg-[#D6C2BC]"></div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Users
                                                                size={14}
                                                                className="text-[#A8A29E]"
                                                            />{" "}
                                                            {item.guests} Orang
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center sm:w-auto">
                                                {/* Jika di tab Belum Bayar, tombolnya jadi Lanjutkan Pembayaran (Kuning) */}
                                                {activeTab === "belum bayar" ? (
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                item.snap_token
                                                            ) {
                                                                // Panggil kasir Midtrans langsung dari sini!
                                                                (
                                                                    window as any
                                                                ).snap.pay(
                                                                    item.snap_token,
                                                                    {
                                                                        onSuccess:
                                                                            function () {
                                                                                router.push(
                                                                                    `/tiket?order_id=${item.id}&transaction_status=settlement`,
                                                                                );
                                                                            },
                                                                        onPending:
                                                                            function () {
                                                                                router.push(
                                                                                    `/tiket?order_id=${item.id}&transaction_status=pending`,
                                                                                );
                                                                            },
                                                                    },
                                                                );
                                                            } else {
                                                                // Jaga-jaga kalau token gagal dimuat
                                                                router.push(
                                                                    `/tiket?order_id=${item.id}&transaction_status=pending`,
                                                                );
                                                            }
                                                        }}
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D97706] hover:shadow-md active:scale-95 sm:w-auto"
                                                    >
                                                        Bayar Sekarang{" "}
                                                        <ChevronRight
                                                            size={16}
                                                        />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/tiket?order_id=${item.id}&transaction_status=settlement`,
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#50281A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#3d1e14] hover:shadow-md active:scale-95 sm:w-auto"
                                                    >
                                                        Lihat Tiket{" "}
                                                        <ChevronRight
                                                            size={16}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        variants={itemVariants}
                                        className="flex flex-col items-center justify-center py-20 text-center"
                                    >
                                        <Search
                                            size={48}
                                            strokeWidth={1}
                                            className="text-[#D6C2BC] mb-4"
                                        />
                                        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                                            Belum Ada Reservasi{" "}
                                            {activeTab === "mendatang"
                                                ? "Mendatang"
                                                : "Riwayat"}
                                        </h3>
                                        <p className="mt-2 text-sm text-[#78716C] max-w-sm">
                                            {activeTab === "mendatang"
                                                ? "Anda belum memiliki jadwal pemesanan restoran ke depannya. Mari mulai eksplorasi tempat makan terbaik."
                                                : "Anda belum memiliki riwayat kunjungan restoran sebelumnya."}
                                        </p>
                                        <Link
                                            href="/eksplorasi"
                                            className="mt-6 rounded-xl bg-[#EBE7E0] px-6 py-3 text-sm font-bold text-[#50281A] transition-colors hover:bg-[#D6C2BC]"
                                        >
                                            Cari Restoran
                                        </Link>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}
