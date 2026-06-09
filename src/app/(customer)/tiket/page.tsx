"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

function TiketContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id");
    const transactionStatus =
        searchParams.get("transaction_status") || searchParams.get("status");

    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                // TAMBAHAN BARU: Ekstrak ID asli dari format Midtrans ("RES-22-12345" menjadi "22")
                let databaseId = orderId;
                if (orderId && orderId.startsWith("RES-")) {
                    databaseId = orderId.split("-")[1];
                }

                // AMBIL TOKEN DARI STORAGE
                const token = localStorage.getItem("token");

                // Menarik data pesanan dari API Laravel DENGAN TOKEN
                // Perhatikan URL di bawah sekarang memakai ${databaseId}, bukan ${orderId} lagi
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
                console.error("Gagal menarik data tiket:", error);
                if (error.response?.status === 401) {
                    console.error(
                        "Sesi tidak valid. Token ditolak oleh Laravel.",
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchOrderData();
        } else {
            setIsLoading(false);
        }
    }, [orderId]);

    // Fungsi format tanggal ke bahasa Indonesia (25 Desember 2026)
    const formatTanggal = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCFB]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D6C2BC] border-t-[#50281A]"></div>
            </div>
        );
    }

    if (!orderData) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-[#FDFCFB]">
                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                    Tiket Tidak Ditemukan
                </h1>
                <Link
                    href="/beranda"
                    className="rounded-xl bg-[#50281A] px-6 py-3 text-white"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-[#FDFCFB] p-6 font-['Inter'] md:p-12">
            {/* Header Status Transaksi Dinamis */}
            <div className="mt-8 flex flex-col items-center text-center">
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ${transactionStatus === "pending" ? "bg-[#F59E0B]" : transactionStatus === "settlement" || transactionStatus === "capture" ? "bg-[#10B981]" : "bg-[#EF4444]"}`}
                >
                    {transactionStatus === "pending" ? (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ) : transactionStatus === "settlement" ||
                      transactionStatus === "capture" ? (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    )}
                </div>
                <h1 className="mt-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#50281A]">
                    {transactionStatus === "pending"
                        ? "Menunggu Pembayaran"
                        : transactionStatus === "settlement" ||
                            transactionStatus === "capture"
                          ? "Reservasi Berhasil"
                          : "Pembayaran Gagal"}
                </h1>
                <p className="mt-2 text-sm text-[#78716C]">
                    {transactionStatus === "pending"
                        ? "Silakan selesaikan pembayaran sesuai instruksi."
                        : transactionStatus === "settlement" ||
                            transactionStatus === "capture"
                          ? "Meja Anda telah disiapkan dengan keanggunan."
                          : "Terjadi masalah pada pembayaran Anda, silakan coba lagi."}
                </p>
            </div>

            {/* Tiket Card Container */}
            <div className="mt-10 flex w-full max-w-lg flex-col gap-4">
                {/* Kartu Detail Pesanan */}
                <div className="flex flex-col rounded-3xl border border-[#D6C2BC]/40 bg-[#F5ECE7]/50 p-6 md:p-8">
                    <div className="flex items-center gap-4 border-b border-[#D6C2BC]/40 pb-6">
                        <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-200">
                            <img
                                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80"
                                alt="Restoran"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                                {orderData.restaurant_name}
                            </h2>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#78716C]">
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span>
                                    Jl. Solo-Purwodadi, Sragen, Kalijambe
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 pt-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Tanggal
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18]">
                                {formatTanggal(orderData.reservation_date)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Waktu
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18]">
                                {orderData.reservation_time} WIB
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Tamu
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18]">
                                {orderData.guests} Orang
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                ID Reservasi
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#C81E1E]">
                                #{orderId}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                ID Reservasi
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#C81E1E]">
                                #{orderId}
                            </span>
                        </div>

                        {/* TAMBAHAN 1: NAMA & WA DI DALAM GRID */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Atas Nama
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18] capitalize">
                                {orderData.customer_name ||
                                    orderData.name ||
                                    "-"}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Nomor WA
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18]">
                                {orderData.customer_phone ||
                                    orderData.phone ||
                                    "-"}
                            </span>
                        </div>

                        {/* TAMBAHAN 2: MEJA (Memakan 2 kolom penuh agar panjang) */}
                        <div className="col-span-2 flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Meja Pilihan
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#1E1B18]">
                                {orderData.table_name ||
                                    orderData.table?.name ||
                                    orderData.table ||
                                    "Dicarikan di lokasi"}
                            </span>
                        </div>
                    </div>

                    {/* order data*/}
                    {(orderData.menus?.length > 0 ||
                        orderData.items?.length > 0) && (
                        <div className="mt-6 border-t border-dashed border-[#D6C2BC]/60 pt-6">
                            <span className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                Pesanan Makanan & Minuman
                            </span>
                            <ul className="flex flex-col gap-3">
                                {/* Otomatis melooping daftar makanan dari API Laravel */}
                                {(orderData.menus || orderData.items).map(
                                    (menu: any, index: number) => (
                                        <li
                                            key={index}
                                            className="flex items-start justify-between text-[14px] font-medium text-[#1E1B18]"
                                        >
                                            <div className="flex gap-2.5">
                                                <span className="font-bold text-[#50281A]">
                                                    {menu.qty || menu.quantity}x
                                                </span>
                                                <span className="capitalize">
                                                    {menu.name ||
                                                        menu.menu_name}
                                                </span>
                                            </div>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Kartu QR Code */}
                {/* Kartu QR Code Dinamis (Tampil Berdasarkan Status) */}
                <div className="flex flex-col items-center justify-center rounded-3xl border border-[#D6C2BC]/40 bg-[#F5ECE7]/30 p-8 text-center">
                    {transactionStatus === "settlement" ||
                    transactionStatus === "capture" ? (
                        <>
                            <p className="mb-4 text-[11px] font-medium text-[#78716C]">
                                Tunjukkan QR Code ini kepada resepsionis saat
                                kedatangan
                            </p>
                            <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
                                {/* API Pembuat QR Code Dinamis */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ORDER-${orderId}`}
                                    alt="QR Code Tiket"
                                    className="h-32 w-32"
                                />
                            </div>
                        </>
                    ) : transactionStatus === "pending" ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FDFCFB] text-[#F59E0B] shadow-sm">
                                <svg
                                    className="h-8 w-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#50281A]">
                                QR Code Terkunci
                            </p>
                            <p className="text-[11px] font-medium text-[#78716C]">
                                Selesaikan pembayaran untuk melihat tiket.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FDFCFB] text-[#EF4444] shadow-sm">
                                <svg
                                    className="h-8 w-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#EF4444]">
                                Tiket Hangus
                            </p>
                            <p className="text-[11px] font-medium text-[#78716C]">
                                Pembayaran dibatalkan atau telah kedaluwarsa.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 flex w-full max-w-lg flex-col gap-3">
                <Link
                    href="/reservasi"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#50281A] font-semibold text-white transition-all hover:bg-[#3d1e14]"
                >
                    Lihat Pesanan Saya
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </Link>
                <Link
                    href="/beranda"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-[#50281A] bg-transparent font-semibold text-[#50281A] transition-all hover:bg-[#F5ECE7]"
                >
                    Kembali ke Beranda
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

export default function TiketPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-[#FDFCFB]" />}>
            <TiketContent />
        </Suspense>
    );
}
