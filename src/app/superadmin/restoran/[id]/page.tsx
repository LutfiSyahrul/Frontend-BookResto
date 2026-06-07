"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Store,
    MapPin,
    Clock,
    Edit,
    ImageIcon,
    CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function DetailRestoranPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [resto, setResto] = useState<any>(null);

    // Helper untuk mengubah $ menjadi teks Rupiah yang rapi
    const formatPriceRange = (price: string) => {
        if (price === "$") return "Murah (< Rp 50.000)";
        if (price === "$$") return "Menengah (Rp 50.000 - Rp 100.000)";
        if (price === "$$$") return "Mahal (> Rp 200.000)";
        return price || "-";
    };

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants/${id}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();
                if (data.success) {
                    setResto(data.data);
                }
            } catch (error) {
                console.error("Gagal menarik detail restoran:", error);
                Swal.fire("Error!", "Gagal memuat data dari server.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchDetail();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="animate-spin h-8 w-8 border-4 border-[#50281A] border-t-transparent rounded-full"></div>
                <p className="text-[#84746E] font-medium animate-pulse">
                    Memuat data restoran...
                </p>
            </div>
        );
    }

    if (!resto) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-[#1E1B18]">
                    Restoran Tidak Ditemukan
                </h2>
                <button
                    onClick={() => router.push("/superadmin/restoran")}
                    className="mt-4 text-[#50281A] underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-10"
        >
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 border border-[#E9E1DC] bg-white rounded-xl text-gray-500 hover:text-[#50281A] hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                                {resto.name}
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    resto.status === "open"
                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                        : "bg-[#FFF3E0] text-[#E65100]"
                                }`}
                            >
                                {resto.status === "open"
                                    ? "Aktif"
                                    : "Nonaktif/Pending"}
                            </span>
                        </div>
                        <p className="text-sm text-[#84746E] mt-0.5">
                            ID: #RES-{String(resto.id).padStart(4, "0")} •
                            Didaftarkan pada{" "}
                            {new Date(resto.created_at).toLocaleDateString(
                                "id-ID",
                            )}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() =>
                        router.push(`/superadmin/restoran/${id}/edit`)
                    }
                    className="flex items-center justify-center gap-2 bg-white border border-[#D6C2BC] text-[#50281A] font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition w-full md:w-auto"
                >
                    <Edit size={18} />
                    Edit Restoran
                </button>
            </div>

            {/* DETAIL CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* KOLOM KIRI (INFO & LOKASI) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <Store className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Informasi Dasar
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div>
                                <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider mb-1">
                                    Kategori
                                </p>
                                <p className="font-semibold text-[#1E1B18]">
                                    {resto.category || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider mb-1">
                                    Range Harga
                                </p>
                                <p className="font-semibold text-[#1E1B18]">
                                    {formatPriceRange(resto.price_range)}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider mb-1">
                                    Deskripsi
                                </p>
                                <p className="text-[#52443F] text-sm leading-relaxed whitespace-pre-wrap">
                                    {resto.description ||
                                        "Belum ada deskripsi untuk restoran ini."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <MapPin className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Lokasi
                            </h3>
                        </div>
                        <p className="text-[#52443F] font-medium">
                            {resto.address || "Alamat belum diatur."}
                        </p>
                    </div>
                </div>

                {/* KOLOM KANAN (MEDIA & JAM OPERASIONAL) */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#E9E1DC] pb-3">
                            <ImageIcon className="text-[#50281A]" size={18} />
                            <h3 className="text-base font-bold text-[#1E1B18]">
                                Gambar Utama
                            </h3>
                        </div>
                        <div className="w-full h-48 rounded-xl bg-gray-100 overflow-hidden border border-[#E9E1DC]">
                            {resto.image ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${resto.image}`}
                                    alt={resto.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#E9E1DC] pb-3">
                            <Clock className="text-[#50281A]" size={18} />
                            <h3 className="text-base font-bold text-[#1E1B18]">
                                Operasional
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-[#84746E]">
                                    Jam Buka
                                </span>
                                <span className="text-sm font-bold text-[#1E1B18]">
                                    {resto.open_time || "--:--"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-[#84746E]">
                                    Jam Tutup
                                </span>
                                <span className="text-sm font-bold text-[#1E1B18]">
                                    {resto.close_time || "--:--"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-[#E9E1DC]">
                                <span className="text-sm font-medium text-[#84746E]">
                                    Interval
                                </span>
                                <span className="text-sm font-bold text-[#1E1B18]">
                                    {resto.time_interval} Menit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
