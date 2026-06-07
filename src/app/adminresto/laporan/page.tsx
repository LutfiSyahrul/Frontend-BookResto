"use client";

import PdfTemplate from "./PdfTemplate";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Download,
    FileSpreadsheet,
    TrendingUp,
    TrendingDown,
    Users,
    Banknote,
    XCircle,
    Smartphone,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";

export default function LaporanPage() {
    const [userName, setUserName] = useState("Administrator");
    const [restaurantName, setRestaurantName] = useState("CoffeeReserve");

    const [startDate, setStartDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split("T")[0],
    );

    // AMBIL BULAN & TAHUN SAAT INI SECARA OTOMATIS (Format: Mei 2026)
    const currentMonthYear = new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
    }).format(new Date());

    // FUNGSI EKSEKUSI CETAK PDF
    const handleExportPDF = async () => {
        const element = document.getElementById("pdf-report-container");
        if (!element) return;

        try {
            // Ubah div HTML jadi gambar Canvas (skala 2 biar HD nggak pecah)
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
            });
            const imgData = canvas.toDataURL("image/png");

            // Setting PDF: Landscape, milimeter, ukuran A4
            const pdf = new jsPDF("landscape", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_${restaurantName}_${currentMonthYear}.pdf`);
        } catch (error) {
            console.error("Gagal export PDF", error);
        }
    };
    // FUNGSI EKSEKUSI CETAK EXCEL
    const handleExportExcel = () => {
        if (!reservations || reservations.length === 0) return;

        // 1. Format ulang datanya biar nama kolom di Excel rapi (Bahasa Indonesia)
        const excelData = reservations.map((res) => ({
            "ID Reservasi": res.id,
            "Nama Tamu": res.name,
            "Tanggal & Waktu": res.datetime,
            "Jumlah Pax": res.pax,
            "Area Meja": res.area,
            "Status Terkini": res.status,
        }));

        // 2. Sulap data JSON menjadi format Worksheet Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Bikin lebar kolomnya rapi otomatis
        worksheet["!cols"] = [
            { wch: 15 }, // ID Reservasi
            { wch: 25 }, // Nama
            { wch: 20 }, // Waktu
            { wch: 12 }, // Pax
            { wch: 20 }, // Area
            { wch: 15 }, // Status
        ];

        // 3. Buat File Excel dan Download
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Reservasi");
        XLSX.writeFile(
            workbook,
            `Laporan_Excel_${restaurantName}_${currentMonthYear}.xlsx`,
        );
    };

    // STATE MANAGEMENT (Siap untuk integrasi API)
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // STATE UNTUK SEMUA DATA (Nilai default 0 saat nunggu loading DB)
    const [stats, setStats] = useState({
        totalReservasi: { value: "0" },
        tamuTerlayani: { value: "0" },
        pendapatan: { value: "Rp 0" },
        pembatalan: { value: "0" },
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [areaDist, setAreaDist] = useState<any[]>([]);

    // FETCH API LARAVEL DENGAN FILTER TANGGAL
    useEffect(() => {
        const fetchLaporan = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                // URL sudah dinamis mengikuti state startDate dan endDate
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/laporan?start_date=${startDate}&end_date=${endDate}`,
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
                    setStats(data.stats);
                    setChartData(data.chartData);
                    setAreaDist(data.areaDist);
                    setReservations(data.reservations);
                    setUserName(data.user_name || "Administrator");
                    setRestaurantName(data.restaurant_name || "CoffeeReserve");
                }
            } catch (error) {
                console.error("Gagal menarik data laporan", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLaporan();
    }, [startDate, endDate]); 

    // PAGINATION LOGIC
    const totalPages = Math.ceil(reservations.length / itemsPerPage);
    const paginatedData = reservations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const generatePagination = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(
                    1,
                    "...",
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages,
                );
            } else {
                pages.push(
                    1,
                    "...",
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    "...",
                    totalPages,
                );
            }
        }
        return pages;
    };

    // HELPER WARNA STATUS
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Selesai":
                return "bg-[#B8EDE4]/60 text-[#1E524C]";
            case "Hadir":
                return "bg-[#FFDBCF] text-[#6B3E2E]";
            case "Menunggu":
                return "bg-[#E9E1DC] text-[#52443F]";
            case "Batal":
                return "bg-[#FFDAD6] text-[#93000A]";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-6xl space-y-8 p-2 md:p-4"
        >
            {/* HEADER & FILTER */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                        Laporan Reservasi
                    </h2>
                    <p className="mt-1 text-sm text-[#52443F]">
                        Ringkasan performa dan data reservasi restoran Anda.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* TOMBOL FILTER TANGGAL DINAMIS */}
                    {/* FILTER TANGGAL DINAMIS (PENGGANTI BULAN INI) */}
                    <div className="flex items-center gap-3 rounded-xl border border-[#D6C2BC] bg-[#F5ECE7] px-4 py-2 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                                Dari
                            </span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-[#50281A] outline-none cursor-pointer"
                            />
                        </div>
                        <span className="text-[#D6C2BC] font-light">|</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                                Sampai
                            </span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-[#50281A] outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 rounded-xl border border-[#D6C2BC] bg-white px-4 py-2.5 text-sm font-semibold text-[#50281A] shadow-sm transition hover:bg-gray-50"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 rounded-xl bg-[#50281A] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#331105]"
                    >
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                </div>
            </div>

            {/* STATISTIC CARDS (BERSIH DARI PERSENAN) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1 */}
                <div className="rounded-2xl border border-[#E9E1DC] bg-[#FFF8F5] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#84746E]">
                            Total Reservasi
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAE0DA] text-[#50281A]">
                            <Smartphone size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-[#1E1B18]">
                        {stats.totalReservasi.value}
                    </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-2xl border border-[#E9E1DC] bg-[#FFF8F5] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#84746E]">
                            Tamu Terlayani
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAE0DA] text-[#50281A]">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-[#1E1B18]">
                        {stats.tamuTerlayani.value}
                    </div>
                </div>

                {/* Card 3 */}
                <div className="rounded-2xl border border-[#E9E1DC] bg-[#FFF8F5] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#84746E]">
                            Pendapatan Estimasi
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAE0DA] text-[#50281A]">
                            <Banknote size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-[#1E1B18]">
                        {stats.pendapatan.value}
                    </div>
                </div>

                {/* Card 4 (Diubah jadi Total Dibatalkan) */}
                <div className="rounded-2xl border border-[#E9E1DC] bg-[#FFF8F5] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#84746E]">
                            Total Dibatalkan
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFDAD6] text-[#93000A]">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-[#1E1B18]">
                        {stats.pembatalan.value}
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* TREN HARIAN (CUSTOM BAR CHART CSS) */}
                <div className="col-span-1 lg:col-span-2 rounded-2xl border border-[#E9E1DC] bg-white p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                            Tren Reservasi Harian
                        </h3>
                        <button className="text-[#84746E] hover:text-[#50281A]">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                    <div className="relative flex-1 flex items-end justify-between gap-2 pt-6 min-h-[150px]">
                        {/* JIKA DATA ADA, TAMPILKAN GRAFIK */}
                        {chartData && chartData.length > 0 ? (
                            chartData.map((data, idx) => (
                                <div
                                    key={idx}
                                    className="relative flex flex-col items-center w-full group h-full justify-end"
                                >
                                    {/* 👇 SUNTIKAN ANGKA PERMANEN (Pakai data.count) 👇 */}
                                    <span className="mb-1 text-[10px] font-bold text-[#50281A]">
                                        {data.count}
                                    </span>

                                    {/* BATANG GRAFIK (Tingginya pakai data.percentage) */}
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{
                                            height: `${data.percentage}%`,
                                        }}
                                        transition={{
                                            duration: 1,
                                            ease: "easeOut",
                                            delay: idx * 0.1,
                                        }}
                                        className="w-full bg-[#EAE0DA] group-hover:bg-[#D6C2BC] transition-colors rounded-t-sm"
                                    />
                                    <span className="mt-2 text-xs font-semibold text-[#84746E]">
                                        {data.day}
                                    </span>
                                </div>
                            ))
                        ) : (
                            /* JIKA DATA KOSONG */
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#84746E]/60">
                                <TrendingDown
                                    size={32}
                                    className="mb-2 opacity-50"
                                />
                                <span className="text-sm font-semibold">
                                    Belum ada data tren harian
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* DISTRIBUSI AREA (PROGRESS BAR) */}
                <div className="col-span-1 rounded-2xl border border-[#E9E1DC] bg-white p-6 shadow-sm">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18] mb-6">
                        Distribusi Area
                    </h3>
                    <div className="space-y-6">
                        {areaDist &&
                            areaDist.map((area, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-end pt-12 border-t border-[#E9E1DC]">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-2.5 w-2.5 rounded-full ${area.color}`}
                                            ></div>
                                            <span className="font-semibold text-[#52443F]">
                                                {area.name}
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#1E1B18]">
                                            {area.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-[#F5ECE7] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${area.percentage}%`,
                                            }}
                                            transition={{
                                                duration: 1,
                                                ease: "easeOut",
                                                delay: 0.3,
                                            }}
                                            className={`h-full rounded-full ${area.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* TABEL DATA TERBARU */}
            <div className="rounded-2xl border border-[#E9E1DC] bg-white shadow-sm overflow-hidden relative min-h-[300px]">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <Loader2
                            className="animate-spin text-[#6B3E2E]"
                            size={40}
                        />
                    </div>
                )}

                <div className="flex items-center justify-between border-b border-[#E9E1DC] p-6 bg-[#FFF8F5]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                        Data Reservasi Terbaru
                    </h3>
                    <button className="text-sm font-semibold text-[#6B3E2E] hover:text-[#50281A] transition">
                        Lihat Semua
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#52443F]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4">ID Reservasi</th>
                                <th className="px-6 py-4">Nama Tamu</th>
                                <th className="px-6 py-4">Tanggal & Waktu</th>
                                <th className="px-6 py-4">Pax</th>
                                <th className="px-6 py-4">Area</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            <AnimatePresence mode="popLayout">
                                {paginatedData.map((res) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        key={res.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 font-bold text-[#1E1B18]">
                                            {res.id}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 font-medium">
                                            {res.name}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {res.datetime}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {res.pax}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {res.area}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(res.status)}`}
                                            >
                                                {res.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E9E1DC] px-6 py-4 bg-white">
                    <span className="text-sm text-[#84746E]">
                        Menampilkan{" "}
                        {reservations.length === 0
                            ? 0
                            : (currentPage - 1) * itemsPerPage + 1}
                        -
                        {Math.min(
                            currentPage * itemsPerPage,
                            reservations.length,
                        )}{" "}
                        dari {reservations.length} data
                    </span>
                    <div className="flex items-center gap-1.5 mt-4 sm:mt-0">
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            disabled={currentPage === 1 || isLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {generatePagination().map((page, i) => (
                            <button
                                key={i}
                                onClick={() =>
                                    typeof page === "number" &&
                                    setCurrentPage(page)
                                }
                                disabled={page === "..." || isLoading}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition disabled:opacity-50 ${currentPage === page ? "border border-[#D6C2BC] bg-[#F5ECE7] text-[#50281A]" : page === "..." ? "bg-transparent text-gray-400 cursor-default" : "text-[#84746E] hover:bg-gray-50"}`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages),
                                )
                            }
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0 ||
                                isLoading
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* COMPONENT TEMPLATE GAIB PDF (OFF-SCREEN) */}
            <PdfTemplate
                stats={stats}
                reservations={reservations}
                currentMonthYear={currentMonthYear}
                userName={userName}
                restaurantName={restaurantName}
            />
        </motion.div>
    );
}
