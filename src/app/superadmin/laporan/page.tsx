"use client";

import * as XLSX from "xlsx";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Download,
    FileText,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    CreditCard,
    Store,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";



export default function LaporanAnalitikPage() {
    //State Penampung Data Dinamis dari Laravel
    const [trendData, setTrendData] = useState<any[]>([]);
    const [topRestoData, setTopRestoData] = useState<any[]>([]);
    const [paymentData, setPaymentData] = useState<any[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);

    const [activeFilter, setActiveFilter] = useState("Bulan Ini");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    // 2. Proses Sedot Data dari API (Otomatis jalan saat halaman dibuka)
    React.useEffect(() => {
        const fetchAnalytics = async () => {
            // Jika pilih custom tapi tanggal belum diisi lengkap, stop jangan tembak API dulu
            if (activeFilter === "Custom" && (!customStart || !customEnd))
                return;

            try {
                const token = localStorage.getItem("token");

                // Rakit URL dinamisnya
                let url = `${process.env.NEXT_PUBLIC_API_URL}/superadmin/reports?filter=${activeFilter}`;
                if (activeFilter === "Custom") {
                    url += `&start_date=${customStart}&end_date=${customEnd}`;
                }

                const response = await fetch(url, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const res = await response.json();

                if (res.success) {
                    setTrendData(res.data.trendData);
                    setTopRestoData(res.data.topRestoData);
                    setPaymentData(res.data.paymentData);
                    setTableData(res.data.tableData);
                }
            } catch (error) {
                console.error("Gagal menarik data analitik:", error);
            }
        };

        fetchAnalytics();
    }, [activeFilter, customStart, customEnd]);

    // 3. Logika Pagination Dinamis (Mengikuti jumlah data asli)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem);
    // Tambahkan || 1 agar tidak error NaN/Infinity saat database masih kosong
    const totalPages = Math.ceil(tableData.length / itemsPerPage) || 1;

    // Menghitung total reservasi asli dari data chart
    const totalReservasi = topRestoData.reduce(
        (acc, curr) => acc + curr.value,
        0,
    );

    // Fungsi untuk Export ke File Asli Excel (.xlsx)
    const handleExport = () => {
        if (tableData.length === 0) return;

        // 1. Petakan data agar header kolomnya cantik dalam bahasa Indonesia
        const formattedData = tableData.map((row) => ({
            Tanggal: row.date,
            "Total Transaksi Berhasil": row.transaksi,
            "Pendapatan Bersih (Rp)": row.pendapatan,
        }));

        // 2. Buat lembar kerja (Worksheet) dari data di atas
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // 3. Buat file Excel (Workbook) dan masukkan lembar kerjanya
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Pendapatan");

        // 4. Proses download langsung jadi file .xlsx!
        const fileName = `Laporan_Pendapatan_${activeFilter.replace(" ", "_")}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // FUNGSI UNTUK MERINGKAS TOMBOL PAGINATION (Contoh: 1, 2, 3, ..., 7)
    const renderPagination = () => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 md:space-y-8 pb-10"
        >
            {/* HEADER SECTION */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                        Laporan & Analitik
                    </h2>
                    <p className="text-sm text-[#84746E] mt-1">
                        Tinjauan komprehensif performa platform berdasarkan
                        transaksi berhasil.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Toggle Filter Waktu */}
                    <div className="flex bg-white border border-[#E9E1DC] rounded-xl p-1 shadow-sm">
                        {/* HANYA SISAKAN BULAN INI DAN TAHUN INI */}
                        {["Bulan Ini", "Tahun Ini"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                                    activeFilter === filter
                                        ? "bg-[#FFF8F5] text-[#50281A] shadow-sm border border-[#E9E1DC]"
                                        : "text-gray-500 hover:text-[#50281A]"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}

                        {/* Jika Custom aktif, tampilkan Date Picker. Jika tidak, tampilkan tombol biasa */}
                        {activeFilter === "Custom" ? (
                            <div className="flex items-center gap-2 px-3 py-1">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) =>
                                        setCustomStart(e.target.value)
                                    }
                                    className="text-xs text-[#50281A] font-semibold border border-[#E9E1DC] bg-[#FFF8F5] rounded-md px-2 py-1.5 outline-none cursor-pointer"
                                />
                                <span className="text-xs text-gray-400 font-medium">
                                    to
                                </span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) =>
                                        setCustomEnd(e.target.value)
                                    }
                                    className="text-xs text-[#50281A] font-semibold border border-[#E9E1DC] bg-[#FFF8F5] rounded-md px-2 py-1.5 outline-none cursor-pointer"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setActiveFilter("Custom")}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-[#50281A] transition"
                            >
                                <Calendar size={16} /> Custom
                            </button>
                        )}
                    </div>

                    {/* TOMBOL PDF DIHAPUS, SISA EXPORT DATA YANG SUDAH BERFUNGSI */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[#50281A] text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] transition"
                    >
                        <Download size={16} /> Export Data
                    </button>
                </div>
            </div>

            {/* CHART 1: TREN TRANSAKSI (Lebar Penuh) */}
            <div className="bg-white p-6 rounded-2xl border border-[#E9E1DC] shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-[#1E1B18] flex items-center gap-2">
                            <TrendingUp size={20} className="text-[#50281A]" />{" "}
                            Tren Transaksi & Pendapatan
                        </h3>
                        <p className="text-sm text-[#84746E]">
                            Pergerakan total pendapatan (IDR) selama periode
                            terpilih.
                        </p>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={trendData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#84746E", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#84746E", fontSize: 12 }}
                                tickFormatter={(value) => `Rp ${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                formatter={(value: any) => [
                                    `Rp ${Number(value).toLocaleString("id-ID")}`,
                                    "Pendapatan",
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="pendapatan"
                                stroke="#50281A"
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                    fill: "#50281A",
                                    strokeWidth: 2,
                                    stroke: "#fff",
                                }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 2 & 3: GRID (Setengah Lebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CHART 2: TOP RESTORAN (Donut Chart) */}
                <div className="bg-white p-6 rounded-2xl border border-[#E9E1DC] shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-[#1E1B18] flex items-center gap-2">
                            <Store size={20} className="text-[#50281A]" /> Top 5
                            Restoran Paling Laris
                        </h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topRestoData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {topRestoData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [
                                        `${value} Transaksi`,
                                        "Total",
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Text in center of Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            {/* UBAH ANGKA 301 MENJADI VARIABEL INI */}
                            <span className="text-3xl font-black text-[#1E1B18]">
                                {totalReservasi}
                            </span>
                            <span className="text-xs font-semibold text-[#84746E]">
                                Total Reservasi
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {topRestoData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <div>
                                    <p className="text-xs font-bold text-[#1E1B18]">
                                        {item.name}
                                    </p>
                                    <p className="text-[11px] text-[#84746E]">
                                        {item.value} trx
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHART 3: METODE PEMBAYARAN (Progress Bar) */}
                <div className="bg-white p-6 rounded-2xl border border-[#E9E1DC] shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#1E1B18] flex items-center gap-2">
                            <CreditCard size={20} className="text-[#50281A]" />{" "}
                            Metode Pembayaran Populer
                        </h3>
                        <p className="text-sm text-[#84746E]">
                            Berdasarkan volume transaksi berhasil.
                        </p>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {paymentData.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">
                                        {item.method}
                                    </span>
                                    <span className="text-[#1E1B18]">
                                        {item.amount}{" "}
                                        <span className="text-gray-400 font-medium">
                                            ({item.percentage}%)
                                        </span>
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${item.percentage}%`,
                                        }}
                                        transition={{
                                            duration: 1,
                                            ease: "easeOut",
                                        }}
                                        className={`h-2.5 rounded-full ${item.color}`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABEL RINCIAN DENGAN PAGINATION */}
            <div className="bg-white border border-[#E9E1DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[#E9E1DC]">
                    <h3 className="text-lg font-bold text-[#1E1B18]">
                        Rincian Pendapatan Harian
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">
                                    Total Transaksi Berhasil
                                </th>
                                <th className="px-6 py-4 text-right">
                                    Pendapatan Bersih
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            {currentItems.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-gray-50/50 transition"
                                >
                                    {/* Gunakan row.date dan row.transaksi sesuai kiriman Laravel */}
                                    <td className="px-6 py-4 font-bold text-[#1E1B18]">
                                        {row.date}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600">
                                        {row.transaksi} Transaksi
                                    </td>
                                    <td className="px-6 py-4 font-black text-[#50281A] text-right">
                                        Rp{" "}
                                        {row.pendapatan.toLocaleString("id-ID")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* INTERAKTIF PAGINATION & TRUNCATED */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E9E1DC] px-6 py-4 bg-white gap-4">
                    {/* Teks "Showing 1 to 5 of 31 entries" yang otomatis akurat */}
                    <span className="text-sm text-[#84746E] font-medium text-center sm:text-left">
                        Showing{" "}
                        <strong className="text-[#1E1B18]">
                            {tableData.length === 0 ? 0 : indexOfFirstItem + 1}{" "}
                            to {Math.min(indexOfLastItem, tableData.length)}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-[#1E1B18]">
                            {tableData.length}
                        </strong>{" "}
                        entries
                    </span>

                    {/* Tombol-tombol Pagination */}
                    <div className="flex items-center gap-1.5">
                        {/* Tombol Kiri (Prev) */}
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={
                                currentPage === 1 || tableData.length === 0
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Looping Angka Ringkas (1, 2, 3, ..., N) */}
                        {renderPagination().map((page, index) => (
                            <button
                                key={index}
                                onClick={() =>
                                    typeof page === "number" &&
                                    setCurrentPage(page)
                                }
                                disabled={page === "..."}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold border transition ${
                                    currentPage === page
                                        ? "border-[#D6C2BC] bg-[#F5ECE7] text-[#50281A]"
                                        : page === "..."
                                          ? "border-transparent text-gray-400 cursor-default"
                                          : "border-transparent text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        {/* Tombol Kanan (Next) */}
                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
                            }
                            disabled={
                                currentPage === totalPages ||
                                tableData.length === 0
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
