"use client";
import { printInvoice } from "./InvoiceTemplate";
import { exportToExcel } from "./ExportTemplate";
import React, { useState, useEffect } from "react"; 
import { motion } from "framer-motion";
import {
    Search,
    Eye,
    Download,
    Calendar,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    FileText,
    DollarSign,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function DataTransaksiPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua Status");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // 1. Siapkan state penampung data dinamis dari backend
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        total_hari_ini: 0,
        pendapatan_hari_ini: 0,
        transaksi_berhasil: 0,
        pending_gagal: 0,
    });

    const [pagination, setPagination] = useState({
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
    });

    // 2. Fetch data dari API Laravel saat halaman dibuka
    // Fetch data dinamis
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem("token");
                // API MENGIKUTI FILTER STATUS & SEARCH
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/transactions?page=${currentPage}&status=${statusFilter}&search=${search}&start_date=${startDate}&end_date=${endDate}`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                const data = await response.json();
                if (data.success) {
                    setTransactions(data.data.data);
                    setSummary(data.summary);
                    setPagination({
                        last_page: data.data.last_page,
                        total: data.data.total,
                        from: data.data.from || 0,
                        to: data.data.to || 0,
                    });
                }
            } catch (error) {
                console.error("Gagal menarik data:", error);
            }
        };

        // Debounce sederhana agar API tidak ditembak tiap ketik huruf
        const delayDebounceFn = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, statusFilter, search, startDate, endDate]); 

    // Helper Styling badge status transaksi
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Berhasil":
                return "bg-[#E8F5E9] text-[#2E7D32]";
            case "Pending":
                return "bg-[#FFF3E0] text-[#E65100]";
            case "Gagal":
                return "bg-[#FFEBEE] text-[#C62828]";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // Handler interaktif tombol aksi - LIHAT DETAIL DINAMIS
    const handleDetail = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/transactions/${id}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const res = await response.json();

            if (res.success) {
                const trx = res.data;

                // Bikin tampilan baris menu makanan yang dibeli
                const itemsHtml = trx.items
                    .map(
                        (item: any) => `
                    <div class="flex justify-between border-b border-gray-100 py-1.5 text-xs">
                        <span class="text-gray-700 font-medium">${item.menu_name} <b class="text-[#50281A]">x${item.quantity}</b></span>
                        <span class="font-bold text-gray-900">Rp ${(item.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                `,
                    )
                    .join("");

                Swal.fire({
                    title: `Detail Transaksi #${trx.id}`,
                    html: `
                        <div class="text-left text-sm space-y-3 p-1">
                            <div class="bg-[#FFF8F5] p-3 rounded-xl border border-[#E9E1DC] space-y-1 text-xs">
                                <p><b>Restoran:</b> <span class="text-[#50281A] font-bold">${trx.restaurant_name}</span></p>
                                <p><b>Waktu Booking:</b> ${trx.reservation_date} @ ${trx.reservation_time}</p>
                                <p><b>Jumlah Kursi:</b> ${trx.guests} Orang</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Daftar Pesanan Menu</p>
                                ${itemsHtml || '<p class="text-xs text-gray-400 italic">Hanya pesan meja saja</p>'}
                            </div>
                            <div class="border-t border-dashed border-[#E9E1DC] pt-2 space-y-1 text-xs">
                                <div class="flex justify-between"><span>Subtotal:</span><span>Rp ${parseInt(trx.subtotal).toLocaleString("id-ID")}</span></div>
                                <div class="flex justify-between text-gray-500"><span>Pajak & Service:</span><span>Rp ${(parseInt(trx.tax) + parseInt(trx.service_charge)).toLocaleString("id-ID")}</span></div>
                                <div class="flex justify-between font-black text-sm text-[#50281A] pt-1"><span>Total Harga:</span><span>Rp ${parseInt(trx.total_price).toLocaleString("id-ID")}</span></div>
                            </div>
                            <div class="text-xs text-gray-500 pt-1">
                                <p><b>Metode Pembayaran:</b> ${trx.payment_method}</p>
                                <p><b>Catatan Pelanggan:</b> <span class="italic text-gray-700">"${trx.notes}"</span></p>
                            </div>
                        </div>
                    `,
                    icon: "info",
                    confirmButtonColor: "#50281A",
                    confirmButtonText: "Tutup",
                });
            }
        } catch (error) {
            console.error("Gagal memuat detail transaksi:", error);
            Swal.fire(
                "Error",
                "Gagal mengambil data detail dari server",
                "error",
            );
        }
    };

    // Handler interaktif tombol aksi - UNDUH/PRINT INVOICE DINAMIS
    const handleDownloadInvoice = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/transactions/${id}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const res = await response.json();

            if (res.success) {
                // Panggil fungsi template invoice eksternal yang terpisah tadi!
                printInvoice(res.data);
            }
        } catch (error) {
            console.error("Gagal mencetak invoice:", error);
            Swal.fire("Error", "Gagal memproses dokumen invoice", "error");
        }
    };

    const handleExport = async () => {
        try {
            Swal.fire({
                title: "Meyiapkan Data...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const token = localStorage.getItem("token");
            // Tembak API dengan parameter export=true (mengambil semua data sesuai filter saat ini)
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/transactions?status=${statusFilter}&search=${search}&start_date=${startDate}&end_date=${endDate}&export=true`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();

            if (data.success) {
                exportToExcel(data.data); 
                Swal.close(); 
            } else {
                Swal.fire("Error", "Gagal mengambil data dari server", "error");
                Swal.close();
            }
        } catch (error) {
            console.error("Gagal memproses export:", error);
            Swal.fire("Error", "Gagal memproses export", "error");
            Swal.close();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 md:space-y-8"
        >
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                        Data Transaksi
                    </h2>
                    <p className="text-sm text-[#84746E] mt-0.5">
                        Memantau dan mengelola semua transaksi restoran.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#52443F] font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition shadow-sm"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* SUMMARY CARDS (4 Kotak Atas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* CARD 1 */}
                <div className="bg-white p-5 rounded-2xl border border-[#E9E1DC] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Total Transaksi Hari Ini
                        </p>
                        <h4 className="text-2xl font-black text-[#1E1B18]">
                            {summary.total_hari_ini}
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#F5ECE7] flex items-center justify-center text-[#50281A]">
                        <FileText size={20} />
                    </div>
                </div>

                {/* CARD 2 */}
                <div className="bg-white p-5 rounded-2xl border border-[#E9E1DC] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Pendapatan Hari Ini
                        </p>
                        <h4 className="text-2xl font-black text-[#1E1B18]">
                            Rp{" "}
                            {summary.pendapatan_hari_ini.toLocaleString(
                                "id-ID",
                            )}
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#F5ECE7] flex items-center justify-center text-[#50281A]">
                        <DollarSign size={20} />
                    </div>
                </div>

                {/* CARD 3 */}
                <div className="bg-white p-5 rounded-2xl border border-[#E9E1DC] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Transaksi Berhasil
                        </p>
                        <h4 className="text-2xl font-black text-[#1E1B18]">
                            {summary.transaksi_berhasil}
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                {/* CARD 4 */}
                <div className="bg-white p-5 rounded-2xl border border-[#E9E1DC] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[#84746E] uppercase tracking-wider">
                            Pending / Gagal
                        </p>
                        <h4 className="text-2xl font-black text-[#1E1B18]">
                            {summary.pending_gagal}
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                        <AlertCircle size={20} />
                    </div>
                </div>
            </div>

            {/* LIVE FILTER BAR */}
            <div className="bg-white p-4 rounded-2xl border border-[#E9E1DC] shadow-sm flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:flex-1">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ID transaksi, restoran, atau nama customer..."
                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-44">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none text-[#52443F] focus:border-[#50281A] transition cursor-pointer"
                        >
                            <option>Semua Status</option>
                            <option>Berhasil</option>
                            <option>Pending</option>
                            <option>Gagal</option>
                        </select>
                    </div>

                    {/* INPUT KALENDER BARU */}
                    <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-xl shadow-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-[#52443F] outline-none cursor-pointer"
                        />
                        <span className="text-gray-400 text-sm font-bold">
                            -
                        </span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-[#52443F] outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="bg-white border border-[#E9E1DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1000px]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4">ID Transaksi</th>
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Restoran</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4">Metode</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            {transactions.map((trx) => (
                                <tr
                                    key={trx.id}
                                    className="hover:bg-gray-50/50 transition"
                                >
                                    <td className="px-6 py-4 font-bold text-[#1E1B18]">
                                        {trx.id}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        {trx.waktu}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-[#50281A]">
                                        {trx.restoran}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-700">
                                        {trx.customer}
                                    </td>
                                    <td className="px-6 py-4 font-black text-[#1E1B18]">
                                        Rp {trx.jumlah.toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600">
                                        {trx.metode}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getStatusStyle(trx.status)}`}
                                        >
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() =>
                                                    handleDetail(trx.id)
                                                }
                                                title="Lihat Detail"
                                                className="p-1.5 text-gray-400 hover:text-[#50281A] hover:bg-[#F5ECE7] rounded-lg transition"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDownloadInvoice(
                                                        trx.id,
                                                    )
                                                }
                                                title="Unduh Invoice"
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                <Download size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION SECTION DINAMIS */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E9E1DC] px-6 py-4 bg-white gap-4">
                    <span className="text-sm text-[#84746E] font-medium">
                        Showing{" "}
                        <strong className="text-[#1E1B18]">
                            {pagination.from} to {pagination.to}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-[#1E1B18]">
                            {pagination.total}
                        </strong>{" "}
                        entries
                    </span>

                    <div className="flex items-center gap-1.5">
                        {/* Tombol Previous */}
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Looping Angka Halaman secara Dinamis */}
                        {Array.from(
                            { length: pagination.last_page },
                            (_, i) => i + 1,
                        ).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold border transition ${
                                    currentPage === page
                                        ? "border-[#D6C2BC] bg-[#F5ECE7] text-[#50281A]"
                                        : "border-transparent text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        {/* Tombol Next */}
                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, pagination.last_page),
                                )
                            }
                            disabled={
                                currentPage === pagination.last_page ||
                                pagination.last_page === 0
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
