"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Utensils,
    Users,
    ReceiptText,
    Wallet,
    Download,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function DashboardGlobalPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk menyimpan data dari Laravel
    const [stats, setStats] = useState({
        restoran: { total: 0, growth: 0 },
        user: { total: 0, growth: 0 },
        transaksi: { total: 0, growth: 0 },
        pendapatan: { total: "Rp 0", growth: 0 },
    });
    const [activities, setActivities] = useState<any[]>([]);
    const [chartRevenue, setChartRevenue] = useState<any[]>([]);
    const [chartGrowth, setChartGrowth] = useState<any[]>([]);

    // Fungsi memanggil API Super Admin
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/dashboard`,
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
                    setStats(data.data.stats);
                    setActivities(data.data.activities);
                    setChartRevenue(data.data.chartRevenue || []);
                    setChartGrowth(data.data.chartGrowth || []);
                }
            } catch (error) {
                console.error("Gagal menarik data dashboard superadmin", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Helper untuk merender persentase dinamis (Warna Hijau/Merah)
    const renderGrowth = (growth: number) => {
        const isPositive = growth >= 0;
        return (
            <p
                className={`text-[11px] md:text-xs font-semibold mt-1 flex items-center gap-1 ${isPositive ? "text-[#1E524C]" : "text-[#93000A]"}`}
            >
                <span>
                    {isPositive ? "↑" : "↓"} {Math.abs(growth)}%
                </span>
                <span className="text-[#84746E] font-medium hidden sm:inline">
                    dari bulan lalu
                </span>
            </p>
        );
    };

    const generateSvgPath = () => {
        if (chartRevenue.length === 0)
            return {
                linePath: "M0,80",
                areaPath: "M0,80 L0,100 L600,100 Z",
                points: [],
            };

        const maxVal = Math.max(...chartRevenue.map((d) => d.value)) || 1;
        const points = chartRevenue.map((d, index) => {
            const x = index * (600 / (chartRevenue.length - 1));
            const y = 90 - (d.value / maxVal) * 80;
            // Bawa sekalian nilai asli dan labelnya
            return { x, y, value: d.value, label: d.label };
        });

        let linePath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            linePath += ` L ${points[i].x} ${points[i].y}`;
        }

        const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

        // Return points-nya juga biar bisa digambar
        return { linePath, areaPath, points };
    };
    const { linePath, areaPath, points } = generateSvgPath();

    // LOGIKA PAGINATION DINAMIS
    const itemsPerPage = 5; // Tampilkan 5 aktivitas per halaman
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActivities = activities.slice(
        indexOfFirstItem,
        indexOfLastItem,
    );
    const totalPages = Math.ceil(activities.length / itemsPerPage) || 1;

    // LOGIKA TRUNCATED PAGINATION (1, 2, 3, ..., N)
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
            className="space-y-6 md:space-y-8"
        >
            {/* WELCOME SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                        Dashboard Global
                    </h2>
                    <p className="text-sm text-[#84746E] mt-0.5">
                        Ringkasan metrik platform dan aktivitas terkini.
                    </p>
                </div>
            </div>

            {/* STATISTIC CARDS (DINAMIS DARI API) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* Card 1 */}
                <div className="bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Total Restoran
                        </span>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#F5ECE7] text-[#50281A] flex items-center justify-center">
                            <Utensils size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl md:text-3xl font-bold text-[#1E1B18]">
                            {isLoading ? "..." : stats.restoran.total}
                        </h3>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Total User
                        </span>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#F5ECE7] text-[#50281A] flex items-center justify-center">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl md:text-3xl font-bold text-[#1E1B18]">
                            {isLoading ? "..." : stats.user.total}
                        </h3>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Total Transaksi
                        </span>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#F5ECE7] text-[#50281A] flex items-center justify-center">
                            <ReceiptText size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl md:text-3xl font-bold text-[#1E1B18]">
                            {isLoading ? "..." : stats.transaksi.total}
                        </h3>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Total Pendapatan
                        </span>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#F5ECE7] text-[#50281A] flex items-center justify-center">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-xl md:text-2xl font-bold text-[#1E1B18]">
                            {isLoading ? "..." : stats.pendapatan.total}
                        </h3>
                    </div>
                </div>
            </div>

            {/* CHARTS GRAPHICS (100% DINAMIS) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Tren Pendapatan Bulanan */}
                <div className="lg:col-span-2 bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col h-[300px] md:h-[360px]">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-base md:text-lg text-[#1E1B18]">
                            Tren Pendapatan Bulanan
                        </h4>
                        <select className="bg-[#FAF5F2] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D6C2BC] outline-none">
                            <option>Tahun Ini</option>
                        </select>
                    </div>

                    <div className="flex-1 w-full relative pt-8 flex items-end">
                        <svg
                            className="w-full h-full md:h-[180px] overflow-visible"
                            viewBox="0 0 600 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient
                                    id="chartGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#50281A"
                                        stopOpacity="0.15"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#50281A"
                                        stopOpacity="0.0"
                                    />
                                </linearGradient>
                            </defs>
                            {/* Path dinamis mengikuti arus pendapatan riil */}
                            <path d={areaPath} fill="url(#chartGrad)" />
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#50281A"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {/*  TITIK & ANGKA DINAMIS  */}
                            {points.map((pt, i) => (
                                <g key={i}>
                                    {/* Lingkaran titik di setiap ujung bulan */}
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="4"
                                        fill="#50281A"
                                    />

                                    {/* Tampilkan angka hanya jika pendapatannya lebih dari 0 */}
                                    {pt.value > 0 && (
                                        <text
                                            x={pt.x}
                                            y={pt.y - 10} // Geser sedikit ke atas titik
                                            fontSize="10"
                                            fill="#50281A"
                                            fontWeight="bold"
                                            textAnchor="middle" // Biar posisinya pas di tengah titik
                                        >
                                            {/* Format angka jadi Rp x.xxx */}
                                            Rp{" "}
                                            {pt.value.toLocaleString("id-ID")}
                                        </text>
                                    )}
                                </g>
                            ))}
                        </svg>

                        {/* Label Bulan Dinamis */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] md:text-[11px] font-bold text-[#84746E] px-2">
                            {chartRevenue.map((d, i) => (
                                <span
                                    key={i}
                                    className={
                                        i > 2 && i < 10
                                            ? ""
                                            : "hidden sm:inline"
                                    }
                                >
                                    {d.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Pertumbuhan Restoran Baru */}
                <div className="bg-white border border-[#E9E1DC] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col h-[300px] md:h-[360px]">
                    <h4 className="font-bold text-base md:text-lg text-[#1E1B18] mb-6 md:mb-8">
                        Pertumbuhan Restoran Baru
                    </h4>
                    <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-1 md:px-2 pb-2 md:pb-4">
                        {/* Looping Batang Diambil Langsung dari Query Kuartal Backend */}
                        {(chartGrowth.length > 0
                            ? chartGrowth
                            : [
                                  { label: "Q1", h: "0%", current: false },
                                  { label: "Q2", h: "0%", current: false },
                                  { label: "Q3", h: "0%", current: false },
                                  { label: "Q4", h: "0%", current: false },
                                  { label: "Q1", h: "0%", current: false },
                                  { label: "Q2", h: "0%", current: false },
                              ]
                        ).map((bar, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center flex-1 gap-2"
                            >
                                <div className="w-full bg-[#FAF5F2] rounded-t-lg relative flex items-end h-32 md:h-40">
                                    <div
                                        style={{ height: bar.h }}
                                        className={`w-full rounded-t-lg transition-all duration-500 ${bar.current ? "bg-[#50281A]" : "bg-[#E9E1DC]"}`}
                                    />
                                </div>
                                <span className="text-[10px] md:text-[11px] font-bold text-[#84746E]">
                                    {bar.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABEL AKTIVITAS TERBARU + PAGINATION */}
            <div className="bg-white border border-[#E9E1DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#E9E1DC] flex items-center justify-between bg-[#FFF8F5]">
                    <h4 className="font-bold text-base md:text-lg text-[#1E1B18]">
                        Aktivitas Terbaru
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4">Restoran / User</th>
                                <th className="px-6 py-4">Tipe Aktivitas</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            {currentActivities.length > 0 ? (
                                currentActivities.map((act) => (
                                    <tr
                                        key={act.id}
                                        className="hover:bg-gray-50/50 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#1E1B18]">
                                                {act.nama}
                                            </div>
                                            <div className="text-xs text-gray-400 font-medium mt-0.5">
                                                {act.sub}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-[#52443F]">
                                            {act.tipe}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {act.tanggal}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                                                    act.status ===
                                                    "Pending Review"
                                                        ? "bg-[#FFE0B2] text-[#E65100]"
                                                        : "bg-[#B8EDE4]/70 text-[#1E524C]"
                                                }`}
                                            >
                                                {act.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-500 font-medium"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-[#50281A] border-t-transparent rounded-full"></span>
                                                Memuat data aktivitas...
                                            </span>
                                        ) : (
                                            "Belum ada aktivitas terbaru."
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION DINAMIS */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E9E1DC] px-5 md:px-6 py-4 bg-white gap-4">
                    <span className="text-xs md:text-sm text-[#84746E] font-medium">
                        Menampilkan{" "}
                        <strong className="text-[#1E1B18]">
                            {activities.length === 0 ? 0 : indexOfFirstItem + 1}
                            -{Math.min(indexOfLastItem, activities.length)}
                        </strong>{" "}
                        dari{" "}
                        <strong className="text-[#1E1B18]">
                            {activities.length}
                        </strong>{" "}
                        data
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Looping angka dinamis dengan titik-titik (Ellipsis) */}
                        {renderPagination().map((page, index) => (
                            <button
                                key={index}
                                onClick={() =>
                                    typeof page === "number" &&
                                    setCurrentPage(page)
                                }
                                disabled={page === "..."}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition ${
                                    currentPage === page
                                        ? "border border-[#D6C2BC] bg-[#F5ECE7] text-[#50281A]"
                                        : page === "..."
                                          ? "border-transparent text-gray-400 cursor-default"
                                          : "text-[#84746E] hover:bg-gray-50"
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
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
