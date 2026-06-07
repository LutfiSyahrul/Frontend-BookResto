"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    Lock,
    CreditCard,
    ChevronDown,
    Smartphone,
    Landmark,
} from "lucide-react";

// TIPE DATA UNTUK ORDER API
interface OrderData {
    restaurant_name: string;
    reservation_date: string;
    reservation_time: string;
    guests: number;
    subtotal: number;
    tax: number;
    service_charge: number;
    total_price: number;
    snap_token?: string;
}

// PERUBAHAN 1: Menambahkan params untuk menangkap ID Restoran
function PembayaranContent({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const resolvedParams = use(params);
    const restoranId = resolvedParams.id;

    const orderId = searchParams.get("order_id") || "123456";
    const transactionStatus = searchParams.get("transaction_status");

    useEffect(() => {
        // Jika terdeteksi kembali dari Midtrans, ambil ID asli lalu lempar ke halaman tiket!
        if (transactionStatus && orderId) {
            const realId = orderId.startsWith("RES-")
                ? orderId.split("-")[1]
                : orderId;
            router.push(
                `/tiket?order_id=${realId}&transaction_status=${transactionStatus}`,
            );
        }
    }, [transactionStatus, orderId, router]);

    const [timeLeft, setTimeLeft] = useState(899); // 14:59
    const [isProcessing, setIsProcessing] = useState(false);

    // STATE BARU: Untuk menampung data tagihan asli dari Laravel
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(true);

    // TIMER & FETCH DATA DARI API
    useEffect(() => {
        // 1. Jalankan Timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // 2. Tarik Data Tagihan dari Laravel (SEKARANG BAWA TOKEN)
        const fetchOrderData = async () => {
            try {
                // AMBIL TOKEN DARI STORAGE
                const token = localStorage.getItem("token");

                // Ekstrak ID asli sebelum fetch API
                let databaseId = orderId;
                if (orderId && orderId.startsWith("RES-")) {
                    databaseId = orderId.split("-")[1];
                }

                // TEMBAK API DENGAN HEADER AUTHORIZATION
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/orders/${databaseId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`, // <--- INI OBATNYA
                        },
                    },
                );

                if (response.data.success) {
                    setOrderData(response.data.data);
                }
            } catch (error: any) {
                console.error("Gagal menarik data pesanan:", error);

                if (error.response?.status === 401) {
                    console.error("Token tidak valid atau belum login.");
                    // Opsional: Boleh ditambahkan redirect ke halaman login di sini
                }

                // Fallback sementara kalau API belum siap / Error
                setOrderData({
                    restaurant_name: "Restoran Terpilih",
                    reservation_date: "Menunggu Data",
                    reservation_time: "-",
                    guests: 0,
                    subtotal: 0,
                    tax: 0,
                    service_charge: 0,
                    total_price: 0,
                });
            } finally {
                setIsLoadingOrder(false);
            }
        };

        if (orderId) {
            fetchOrderData();
        }

        return () => clearInterval(timer);
    }, [orderId]);

    // INTEGRASI MIDTRANS SNAP SCRIPT
    // INTEGRASI MIDTRANS SNAP SCRIPT
    useEffect(() => {
        // Tarik URL dan Client Key dari environment variables
        const midtransScriptUrl =
            process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "";
        const myMidtransClientKey =
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

        let scriptTag = document.createElement("script");
        scriptTag.src = midtransScriptUrl;
        scriptTag.setAttribute("data-client-key", myMidtransClientKey);

        document.body.appendChild(scriptTag);

        return () => {
            document.body.removeChild(scriptTag);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const handleBayarSekarang = () => {
        // mengecek dulu apakah tokennya ada dari backend
        if (!orderData || !orderData.snap_token) {
            alert(
                "Sistem sedang memuat tiket pembayaran atau token tidak ditemukan. Mohon tunggu.",
            );
            return;
        }

        setIsProcessing(true);

        // Panggil Pop-Up Kasir Midtrans dengan token yang sudah didapat dari backend
        window.snap.pay(orderData.snap_token, {
            onSuccess: function (result: any) {
                //console.log("Sukses Bayar!", result);
                setIsProcessing(false);
                router.push(`/tiket?order_id=${orderId}&status=success`);
            },
            onPending: function (result: any) {
                //console.log("Menunggu Pembayaran...", result);
                setIsProcessing(false);
                router.push(`/tiket?order_id=${orderId}&status=pending`);
            },
            onError: function (result: any) {
                alert("Pembayaran Gagal. Silakan coba lagi.");
                setIsProcessing(false);
            },
            onClose: function () {
                setIsProcessing(false);
            },
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#F9F4EE] font-['Inter'] text-[#1E1B18]">
            {/* NAV / HEADER */}
            <nav className="flex h-[80px] w-full items-center justify-center border-b border-[#D6C2BC]/20 bg-[#F9F4EE] px-6 lg:px-10">
                <div className="flex w-full max-w-[1200px] items-center justify-between">
                    <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                        Booking Resto
                    </h1>
                    <div className="flex items-center gap-2 text-[#8C7E7A]">
                        <Lock size={18} />
                        <span className="text-sm font-medium">
                            Pembayaran Aman
                        </span>
                    </div>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-[600px] flex-col gap-6 px-6 py-10 lg:py-16">
                {/* Timer Banner (Sekarang di atas Ringkasan) */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-xl bg-[#FDE8E8] px-6 py-4 text-[#C81E1E]"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 animate-ping rounded-full bg-[#C81E1E]"></div>
                        <span className="text-sm font-semibold md:text-base">
                            Selesaikan pembayaran dalam
                        </span>
                    </div>
                    <span className="text-xl font-bold tabular-nums md:text-2xl">
                        {formatTime(timeLeft)}
                    </span>
                </motion.div>

                {/* KOTAK RINGKASAN RESERVASI (Full Width di dalam container 600px) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col rounded-3xl border border-[#D6C2BC]/30 bg-white p-8 shadow-sm"
                >
                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                        Ringkasan Reservasi
                    </h3>

                    {isLoadingOrder ? (
                        <div className="mt-8 flex flex-col items-center justify-center py-6 text-gray-400">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#50281A] border-t-transparent mb-2"></div>
                            <span className="text-sm">
                                Memuat data tagihan...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 flex gap-4 border-b border-gray-100 pb-6">
                                <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                                    <img
                                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"
                                        className="h-full w-full object-cover"
                                        alt="Restoran"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[#50281A]">
                                        {orderData?.restaurant_name ||
                                            "Restoran Terpilih"}
                                    </span>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        <Smartphone size={12} />{" "}
                                        {orderData?.reservation_date || "-"},{" "}
                                        {orderData?.reservation_time || "-"} WIB
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                        <Smartphone size={12} />{" "}
                                        {orderData?.guests || 0} Orang
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-b border-gray-100 pb-6 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal Pesanan</span>
                                    <span className="font-medium text-gray-900">
                                        Rp{" "}
                                        {(
                                            orderData?.subtotal || 0
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Layanan & Pajak (16%)</span>
                                    <span className="font-medium text-gray-900">
                                        Rp{" "}
                                        {(
                                            (orderData?.tax || 0) +
                                            (orderData?.service_charge || 0)
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <span className="font-bold text-gray-900">
                                    Total Pembayaran
                                </span>
                                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#1E1B18]">
                                    Rp{" "}
                                    {(
                                        orderData?.total_price || 0
                                    ).toLocaleString("id-ID")}
                                </span>
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleBayarSekarang}
                        disabled={isProcessing || isLoadingOrder}
                        className="group mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#50281A] font-bold text-white transition-all hover:bg-[#3d1e14] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                    >
                        {!isProcessing && <Lock size={18} />}
                        {isProcessing ? "Memverifikasi..." : "Bayar Sekarang"}
                    </button>

                    <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
                        Dengan menekan tombol, Anda menyetujui Syarat &
                        Ketentuan.
                    </p>
                </motion.div>
            </main>

            <footer className="mt-20 border-t border-[#D6C2BC]/20 bg-[#F9F4EE] py-12">
                <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-8 px-6 md:flex-row">
                    <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#50281A]">
                        Booking Resto
                    </span>
                    <div className="flex gap-8 text-sm text-gray-500">
                        <span>Tentang Kami</span>
                        <span>Pusat Bantuan</span>
                        <span>Kebijakan Privasi</span>
                    </div>
                    <span className="text-xs text-gray-400">
                        © 2026 Booking Resto. Hak Cipta Dilindungi.
                    </span>
                </div>
            </footer>
        </div>
    );
}

// PERUBAHAN 2: Wrapper menerima params
export default function PembayaranPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="h-screen w-full flex items-center justify-center bg-[#F9F4EE]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D6C2BC] border-t-[#50281A]"></div>
                </div>
            }
        >
            <PembayaranContent params={params} />
        </Suspense>
    );
}
declare global {
    interface Window {
        snap: any;
    }
}
