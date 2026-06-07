"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X } from "lucide-react";
import Swal from "sweetalert2";

export default function SystemSettingsPage() {
    // 1. STATE UNTUK GENERAL CONFIGURATION
    const [platformName, setPlatformName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");

    // 2. STATE UNTUK FINANCIAL PARAMETERS
    const [taxRate, setTaxRate] = useState("");
    const [serviceRate, setServiceRate] = useState("");

    // 3. STATE UNTUK MAINTENANCE MODE
    const [isMaintenance, setIsMaintenance] = useState(false);

    // SEDOT DATA DARI LARAVEL SAAT HALAMAN DIBUKA
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
            const res = await response.json();

            if (res.success && res.data) {
                setPlatformName(res.data.platform_name || "");
                setContactEmail(res.data.contact_email || "");
                setWhatsapp(res.data.whatsapp || "");
                setTaxRate(res.data.tax_rate || "");
                setServiceRate(res.data.service_rate || "");
                setIsMaintenance(res.data.is_maintenance === 1);
            }
        } catch (error) {
            console.error("Gagal mengambil data pengaturan:", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // HANDLER SIMPAN PENGATURAN (TEMBAK API POST)
    const handleSave = () => {
        Swal.fire({
            title: "Simpan Perubahan?",
            text: "Pengaturan sistem akan diperbarui dan langsung berdampak pada aplikasi.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#50281A",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Simpan!",
            cancelButtonText: "Batal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({
                        title: "Menyimpan...",
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    const token = localStorage.getItem("token");
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/superadmin/settings`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                platform_name: platformName,
                                contact_email: contactEmail,
                                whatsapp: whatsapp,
                                tax_rate: taxRate,
                                service_rate: serviceRate,
                                is_maintenance: isMaintenance ? 1 : 0,
                            }),
                        },
                    );

                    const res = await response.json();

                    if (res.success) {
                        Swal.fire("Tersimpan!", res.message, "success");
                    }
                } catch (error) {
                    Swal.fire(
                        "Error!",
                        "Terjadi kesalahan pada server.",
                        "error",
                    );
                }
            }
        });
    };

    // HANDLER BATAL
    const handleDiscard = () => {
        Swal.fire({
            title: "Batalkan Perubahan?",
            text: "Semua isian yang belum disave akan kembali seperti semula.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#50281A",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Batalkan",
            cancelButtonText: "Kembali",
        }).then((result) => {
            if (result.isConfirmed) {
                fetchSettings(); // Tarik ulang data asli dari database
                Swal.fire(
                    "Dibatalkan",
                    "Pengaturan dikembalikan ke awal.",
                    "info",
                );
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 md:space-y-8 max-w-4xl pb-10"
        >
            {/* HEADER */}
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                    System Settings
                </h2>
                <p className="text-sm text-[#84746E] mt-1">
                    Konfigurasi variabel utama platform dan parameter
                    operasional.
                </p>
            </div>

            {/* 1. GENERAL CONFIGURATION */}
            <div className="bg-[#FAF8F7] p-6 rounded-2xl border border-[#E9E1DC]">
                <div className="mb-5">
                    <h3 className="text-lg font-bold text-[#50281A]">
                        General Configuration
                    </h3>
                    <p className="text-xs text-[#84746E]">
                        Informasi dasar dan detail kontak platform.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#1E1B18]">
                            Platform Name
                        </label>
                        <input
                            type="text"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            className="w-full bg-white border border-[#E9E1DC] rounded-xl px-4 py-2.5 text-sm text-[#1E1B18] outline-none focus:border-[#50281A] transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#1E1B18]">
                            Admin Contact Email
                        </label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full bg-white border border-[#E9E1DC] rounded-xl px-4 py-2.5 text-sm text-[#1E1B18] outline-none focus:border-[#50281A] transition"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-[#1E1B18]">
                            Nomor WhatsApp CS
                        </label>
                        <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            className="w-full bg-white border border-[#E9E1DC] rounded-xl px-4 py-2.5 text-sm text-[#1E1B18] outline-none focus:border-[#50281A] transition"
                        />
                    </div>
                </div>
            </div>

            {/* 2. FINANCIAL PARAMETERS */}
            <div className="bg-[#FAF8F7] p-6 rounded-2xl border border-[#E9E1DC]">
                <div className="mb-5">
                    <h3 className="text-lg font-bold text-[#50281A]">
                        Financial Parameters
                    </h3>
                    <p className="text-xs text-[#84746E]">
                        Atur standar pajak dan persentase biaya layanan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                    {/* Kotak 1: Pajak PPN */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#1E1B18]">
                            Pajak (PPN) %
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                className="w-full bg-white border border-[#E9E1DC] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#1E1B18] outline-none focus:border-[#50281A] transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                                %
                            </span>
                        </div>
                        <p className="text-[11px] text-[#84746E]">
                            Pajak negara yang dibebankan ke customer.
                        </p>
                    </div>

                    {/* Kotak 2: Biaya Layanan */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#1E1B18]">
                            Biaya Layanan (Platform Fee) %
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={serviceRate}
                                onChange={(e) => setServiceRate(e.target.value)}
                                className="w-full bg-white border border-[#E9E1DC] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#1E1B18] outline-none focus:border-[#50281A] transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                                %
                            </span>
                        </div>
                        <p className="text-[11px] text-[#84746E]">
                            Keuntungan platform Booking Resto.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. OPERATIONAL STATE */}
            <div className="bg-[#FAF8F7] p-6 rounded-2xl border border-[#E9E1DC]">
                <div className="mb-5">
                    <h3 className="text-lg font-bold text-[#50281A]">
                        Operational State
                    </h3>
                    <p className="text-xs text-[#84746E]">
                        Kontrol ketersediaan platform.
                    </p>
                </div>

                <div className="bg-white border border-[#E9E1DC] rounded-xl p-5 flex items-center justify-between">
                    <div className="pr-6">
                        <p className="text-sm font-bold text-[#1E1B18]">
                            Maintenance Mode
                        </p>
                        <p className="text-xs text-[#84746E] mt-1 leading-relaxed">
                            Jika aktif, *customer* tidak bisa mengakses halaman
                            utama atau melakukan reservasi. Akses admin tetap
                            terbuka.
                        </p>
                    </div>
                    {/* TOGGLE SWITCH */}
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isMaintenance}
                            onChange={(e) => setIsMaintenance(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#50281A]"></div>
                    </label>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E9E1DC]">
                <button
                    onClick={handleDiscard}
                    className="flex items-center gap-2 px-6 py-2.5 border border-[#E9E1DC] text-[#52443F] text-sm font-bold rounded-xl hover:bg-gray-50 transition"
                >
                    <X size={16} /> Discard Changes
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#50281A] text-white text-sm font-bold rounded-xl hover:bg-[#3A1D13] transition shadow-md"
                >
                    <Save size={16} /> Save Configuration
                </button>
            </div>
        </motion.div>
    );
}
