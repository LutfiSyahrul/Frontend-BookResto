"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    CheckCircle2,
    XCircle,
    FileText,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReservasiPage() {
    // 1. STATE UNTUK DATA DINAMIS DARI LARAVEL
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // STATE UNTUK MODAL DETAIL & CEKLIS
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any>(null);
    const [checkedMenus, setCheckedMenus] = useState<number[]>([]);

    const [isSuccessServing, setIsSuccessServing] = useState(false);

    // 2. STATE UNTUK FILTER & PAGINATION
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua Status");

    const [dateFilter, setDateFilter] = useState(
        new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // STATE UNTUK POPUP KONFIRMASI CUSTOM
    const [confirmPopup, setConfirmPopup] = useState<{
        isOpen: boolean;
        id: number | null;
        action: "check_in" | "cancel" | "checkout" | null;
        message: string;
    }>({ isOpen: false, id: null, action: null, message: "" });

    // 3. EFEK DEBOUNCE UNTUK PENCARIAN (Biar server tidak jebol di-spam)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 4. FUNGSI UTAMA MENARIK DATA KE BACKEND LARAVEL
    // 4. FUNGSI UTAMA MENARIK DATA KE BACKEND LARAVEL
    const fetchReservations = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Rakit URL dengan parameter
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/reservations`);
            url.searchParams.append("page", currentPage.toString());
            url.searchParams.append("per_page", "4");

            if (debouncedSearch)
                url.searchParams.append("search", debouncedSearch);
            if (statusFilter !== "Semua Status")
                url.searchParams.append("status", statusFilter);

            // TAMBAHKAN PARAMETER TANGGAL KE URL
            if (dateFilter) url.searchParams.append("date", dateFilter);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setReservations(data.data);
                setTotalPages(data.pagination.last_page);
                setTotalItems(data.pagination.total_items);
            }
        } catch (error) {
            console.error("Gagal menarik data reservasi", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Pantau perubahan: Tambahkan dateFilter ke dalam array dependency!
    useEffect(() => {
        fetchReservations();
    }, [currentPage, debouncedSearch, statusFilter, dateFilter]);

    // 5. TRIGGER BUKA POPUP KONFIRMASI (GANTI WINDOW.CONFIRM)
    const handleUpdateStatus = (
        id: number,
        action: "check_in" | "cancel" | "checkout",
    ) => {
        const confirmMsg =
            action === "check_in"
                ? "Apakah Anda yakin ingin melakukan Check-in untuk pelanggan ini?"
                : action === "checkout"
                  ? "Checkout pelanggan ini? Meja akan otomatis dikosongkan."
                  : "Apakah Anda yakin ingin membatalkan reservasi ini?";

        setConfirmPopup({ isOpen: true, id, action, message: confirmMsg });
    };

    // 6. EKSEKUSI API SETELAH DIKONFIRMASI DI POPUP CUSTOM
    const executeUpdateStatus = async () => {
        const { id, action } = confirmPopup;
        if (!id || !action) return;

        setConfirmPopup((prev) => ({ ...prev, isOpen: false })); // Tutup popup instan

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/reservations/${id}/status`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ action }),
                },
            );

            const data = await response.json();
            if (data.success) {
                fetchReservations(); // Refresh tabel otomatis
            } else {
                console.error(data.message || "Gagal update status");
            }
        } catch (error) {
            console.error("Terjadi kesalahan sistem", error);
        }
    };

    //fungsi modal ceklis
    const handleOpenDetail = async (id: number) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/reservations/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            const data = await response.json();
            if (data.success) {
                setSelectedDetail(data.data);

                // BACA STATUS DARI BACKEND, masukkan ID yang is_served-nya true ke dalam state
                const servedIds = data.data.menus
                    .filter((menu: any) => menu.is_served)
                    .map((menu: any) => menu.id);

                setCheckedMenus(servedIds);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Gagal tarik detail:", error);
        }
    };
    const toggleCheckMenu = (menuId: number) => {
        setCheckedMenus((prev) =>
            prev.includes(menuId)
                ? prev.filter((id) => id !== menuId)
                : [...prev, menuId],
        );
    };

    const handleCheckout = () => {
        if (!selectedDetail) return;
        handleUpdateStatus(selectedDetail.id, "checkout");
        setIsModalOpen(false);
    };

    // FUNGSI PEMBANTU WARNA UI
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Checked-in":
                return "bg-[#E8F5E9] text-[#2E7D32]";
            case "Selesai":
                return "bg-[#E0F7FA] text-[#006064]";
            case "Dibatalkan":
                return "bg-[#FFEBEE] text-[#C62828]";
            default:
                return "bg-[#F5ECE7] text-[#84746E]";
        }
    };

    const getInitialStyle = (status: string) => {
        switch (status) {
            case "Checked-in":
                return "bg-[#B8EDE4] text-[#00201D]";
            case "Selesai":
                return "bg-[#E0F7FA] text-[#006064]";
            case "Dibatalkan":
                return "bg-[#FFDAD6] text-[#93000A]";
            default:
                return "bg-[#FFDBCF] text-[#331105]";
        }
    };

    const handleServeOrder = async () => {
        if (!selectedDetail) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/reservations/${selectedDetail.id}/serve`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ menu_ids: checkedMenus }),
                },
            );

            const data = await response.json();
            if (data.success) {
                setIsSuccessServing(true);

                // Tutup modal setelah 2 detik
                setTimeout(() => {
                    setIsModalOpen(false);
                    setIsSuccessServing(false);
                }, 2000);
            }
        } catch (error) {
            console.error("Gagal menyimpan pesanan", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-6xl space-y-6"
        >
            {/* HEADER & FILTER */}
            <div className="flex flex-col gap-6 rounded-2xl bg-[#FFF8F5] p-6 shadow-sm md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#6B3E2E]">
                        Management Reservasi
                    </h2>
                    <p className="mt-1 text-sm text-[#52443F]">
                        Kelola jadwal reservasi dan status meja untuk hari ini.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84746E]"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari nama customer..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Balik ke halaman 1 saat ngetik
                            }}
                            className="w-full rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#6B3E2E] focus:ring-2 focus:ring-[#6B3E2E]/20"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex items-center">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="peer rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] pl-10 pr-4 py-2.5 text-sm font-medium text-[#6B3E2E] outline-none transition hover:bg-[#EAE0DA] focus:border-[#6B3E2E] focus:ring-2 focus:ring-[#6B3E2E]/20"
                            />
                            <Calendar
                                size={16}
                                className="absolute left-3 text-[#6B3E2E] pointer-events-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1); // Balik ke halaman 1 saat ganti filter
                            }}
                            className="rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] px-4 py-2.5 text-sm font-medium text-[#6B3E2E] outline-none transition hover:bg-[#EAE0DA]"
                        >
                            <option value="Semua Status">Semua Status</option>
                            <option value="Menunggu">Menunggu</option>
                            <option value="Checked-in">Checked-in</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABEL DATA */}
            <div className="overflow-hidden rounded-xl border border-[#E9E1DC] bg-[#FFF8F5] shadow-[0_8px_32px_rgba(107,62,46,0.06)] relative min-h-[300px]">
                {/* Overlay Loading */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FFF8F5]/60 backdrop-blur-sm">
                        <Loader2
                            className="animate-spin text-[#6B3E2E]"
                            size={32}
                        />
                    </div>
                )}

                <div className="hidden grid-cols-12 border-b border-[#E9E1DC] px-6 py-4 text-xs font-bold tracking-wider text-[#84746E] md:grid">
                    <div className="col-span-4">NAMA CUSTOMER</div>
                    <div className="col-span-2">JAM</div>
                    <div className="col-span-2">MEJA</div>
                    <div className="col-span-2">STATUS</div>
                    <div className="col-span-2 text-right">AKSI</div>
                </div>

                <div className="divide-y divide-[#E9E1DC]">
                    <AnimatePresence mode="popLayout">
                        {reservations.length > 0
                            ? reservations.map((res) => (
                                  <motion.div
                                      layout
                                      initial={{
                                          opacity: 0,
                                          scale: 0.95,
                                          y: -10,
                                      }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{
                                          opacity: 0,
                                          scale: 0.95,
                                          filter: "blur(4px)",
                                      }}
                                      transition={{
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 25,
                                      }}
                                      key={res.id}
                                      className="grid grid-cols-1 items-center gap-4 p-4 transition hover:bg-white/50 md:grid-cols-12 md:px-6 md:py-4"
                                  >
                                      <div className="col-span-4 flex items-center gap-3">
                                          <div
                                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${getInitialStyle(res.status)}`}
                                          >
                                              {res.initial}
                                          </div>
                                          {/* KITA BIKIN SUSUNAN ATAS BAWAH DI SINI */}
                                          <div className="flex flex-col">
                                              <span
                                                  className={`font-medium ${res.status === "Dibatalkan" ? "text-gray-400 line-through" : "text-[#1E1B18]"}`}
                                              >
                                                  {res.name}
                                              </span>
                                              {/* Tampilkan nomor WA jika datanya dilempar dari backend */}
                                              {res.phone && (
                                                  <a
                                                      href={`https://wa.me/${res.phone.replace(/[^0-9]/g, "")}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                                                  >
                                                      {res.phone}
                                                      {/* logo whatshap  */}
                                                  </a>
                                              )}
                                          </div>
                                      </div>

                                      <div className="col-span-2 text-sm text-[#52443F] max-md:hidden">
                                          {res.time}
                                      </div>
                                      <div className="col-span-2 max-md:hidden">
                                          <span className="inline-flex items-center rounded-md bg-[#E6E2DA] px-2.5 py-1 text-xs font-semibold text-[#66645E]">
                                              {res.table} ({res.pax} Pax)
                                          </span>
                                      </div>

                                      <div className="flex gap-2 text-sm text-[#52443F] md:hidden">
                                          <span>{res.time}</span> •
                                          <span className="font-semibold">
                                              {res.table} ({res.pax} Pax)
                                          </span>
                                      </div>

                                      {/* MENGUBAH BIAR BISA NUMPUK ATAS BAWAH*/}
                                      <div className="col-span-2 flex flex-col gap-1.5 items-start">
                                          {/* 1. Status Reservasi (Bawaan Asli) */}
                                          <span
                                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(res.status)}`}
                                          >
                                              <span
                                                  className={`h-1.5 w-1.5 rounded-full ${res.status === "Checked-in" ? "bg-[#2E7D32]" : res.status === "Dibatalkan" ? "bg-[#C62828]" : "bg-[#84746E]"}`}
                                              ></span>
                                              {res.status}
                                          </span>

                                          {/* 2. Badge Status Pembayaran Baru */}
                                          <span
                                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                  res.payment_status === "Lunas"
                                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                              }`}
                                          >
                                              {res.payment_status === "Lunas"
                                                  ? "💵 Lunas"
                                                  : "⏳ Belum Bayar"}
                                          </span>
                                      </div>

                                      <div className="col-span-2 flex items-center justify-start gap-2 md:justify-end">
                                          {res.status === "Menunggu" && (
                                              <>
                                                  <button
                                                      onClick={() =>
                                                          handleUpdateStatus(
                                                              res.id,
                                                              "check_in",
                                                          )
                                                      }
                                                      className="flex items-center gap-1 rounded-md border border-[#C8E6C9] bg-[#E8F5E9] px-3 py-1.5 text-xs font-bold text-[#2E7D32] transition hover:bg-[#C8E6C9] active:scale-95"
                                                  >
                                                      <CheckCircle2 size={14} />{" "}
                                                      <span className="max-md:hidden">
                                                          Check-in
                                                      </span>
                                                  </button>
                                                  <button
                                                      onClick={() =>
                                                          handleUpdateStatus(
                                                              res.id,
                                                              "cancel",
                                                          )
                                                      }
                                                      className="flex items-center gap-1 rounded-md border border-[#FFCDD2] bg-[#FFEBEE] px-3 py-1.5 text-xs font-bold text-[#C62828] transition hover:bg-[#FFCDD2] active:scale-95"
                                                  >
                                                      <XCircle size={14} />{" "}
                                                      <span className="max-md:hidden">
                                                          Batal
                                                      </span>
                                                  </button>
                                              </>
                                          )}
                                          {res.status === "Checked-in" && (
                                              <div className="flex gap-2">
                                                  {/* Tombol 1: Murni buat Intip & Ceklis Dapur */}
                                                  <button
                                                      onClick={() =>
                                                          handleOpenDetail(
                                                              res.id,
                                                          )
                                                      }
                                                      className="flex items-center gap-1 rounded-md border border-[#D6C2BC] bg-[#F5ECE7] px-3 py-1.5 text-xs font-bold text-[#1E1B18] transition hover:bg-[#EAE0DA] active:scale-95"
                                                  >
                                                      <FileText size={14} />{" "}
                                                      Detail
                                                  </button>

                                                  {/* Tombol 2: Tombol Sakti Kasir buat Kosongkan Meja */}
                                                  <button
                                                      onClick={() =>
                                                          handleUpdateStatus(
                                                              res.id,
                                                              "checkout",
                                                          )
                                                      }
                                                      className="flex items-center gap-1 rounded-md border border-[#BCAAA4] bg-[#50281A] text-white px-3 py-1.5 text-xs font-bold transition hover:bg-[#3d1e14] active:scale-95"
                                                  >
                                                      <CheckCircle2 size={14} />{" "}
                                                      Checkout
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </motion.div>
                              ))
                            : !isLoading && (
                                  <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="py-12 text-center text-[#84746E]"
                                  >
                                      Tidak ada reservasi yang ditemukan.
                                  </motion.div>
                              )}
                    </AnimatePresence>
                </div>

                {/* PAGINATION SERVER-SIDE */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E9E1DC] px-6 py-4 sm:flex-row">
                    <span className="text-sm text-[#52443F]">
                        Menampilkan{" "}
                        {totalItems === 0 ? 0 : (currentPage - 1) * 4 + 1} -{" "}
                        {Math.min(currentPage * 4, totalItems)} dari{" "}
                        {totalItems} reservasi
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1 || isLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#1E1B18] transition hover:bg-[#F5ECE7] active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                disabled={isLoading}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition active:scale-90 disabled:opacity-50 ${currentPage === i + 1 ? "bg-[#6B3E2E] text-white shadow-md" : "border border-[#D6C2BC] text-[#1E1B18] hover:bg-[#F5ECE7]"}`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
                            }
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0 ||
                                isLoading
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#1E1B18] transition hover:bg-[#F5ECE7] active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DETAIL & CEKLIS */}
            {/* MODAL POP-UP INTERAKTIF */}
            <AnimatePresence>
                {isModalOpen && selectedDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
                        >
                            <AnimatePresence mode="wait">
                                {!isSuccessServing ? (
                                    <motion.div
                                        key="checklist"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* HEADER DENGAN PROGRESS BAR */}
                                        <div className="relative border-b border-[#EAE0DA] bg-[#FFF8F5] p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E]">
                                                        Meja:{" "}
                                                        {selectedDetail.table}
                                                    </h3>
                                                    <p className="text-sm text-[#84746E]">
                                                        {selectedDetail.name}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        setIsModalOpen(false)
                                                    }
                                                    className="rounded-full bg-white/50 p-2 text-[#6B3E2E] hover:bg-[#D6C2BC] transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* PROGRESS BAR INTERAKTIF */}
                                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE0DA]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${(checkedMenus.length / selectedDetail.menus.length) * 100}%`,
                                                    }}
                                                    className="h-full bg-[#6B3E2E]"
                                                />
                                            </div>
                                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#6B3E2E]">
                                                {checkedMenus.length} dari{" "}
                                                {selectedDetail.menus.length}{" "}
                                                Menu Siap
                                            </p>
                                        </div>

                                        {/* LIST MENU DENGAN MICRO-INTERACTION */}
                                        <div className="max-h-[350px] overflow-y-auto p-6 space-y-3">
                                            {selectedDetail.menus.map(
                                                (menu: any) => (
                                                    <motion.label
                                                        whileTap={{
                                                            scale: 0.98,
                                                        }}
                                                        key={menu.id}
                                                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-all ${checkedMenus.includes(menu.id) ? "border-[#6B3E2E] bg-[#FFF8F5]" : "border-[#EAE0DA] hover:border-[#D6C2BC]"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checkedMenus.includes(
                                                                menu.id,
                                                            )}
                                                            onChange={() =>
                                                                toggleCheckMenu(
                                                                    menu.id,
                                                                )
                                                            }
                                                            className="mt-1 h-5 w-5 rounded-md border-[#D6C2BC] text-[#6B3E2E] focus:ring-[#6B3E2E]"
                                                        />
                                                        <div className="flex-1">
                                                            <span
                                                                className={`font-bold transition-all ${checkedMenus.includes(menu.id) ? "text-[#6B3E2E]" : "text-[#1E1B18]"}`}
                                                            >
                                                                {menu.qty}x{" "}
                                                                {menu.name}
                                                            </span>
                                                            {menu.notes && (
                                                                <p className="mt-1 text-xs text-[#84746E]">
                                                                    Note:{" "}
                                                                    {menu.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.label>
                                                ),
                                            )}
                                        </div>

                                        {/* FOOTER BUTTON */}
                                        <div className="p-6">
                                            <button
                                                onClick={handleServeOrder}
                                                disabled={
                                                    checkedMenus.length !==
                                                    selectedDetail.menus.length
                                                }
                                                className="w-full rounded-2xl bg-[#50281A] py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#3d1e14] disabled:cursor-not-allowed disabled:opacity-30 active:scale-[0.98]"
                                            >
                                                Sajikan Pesanan
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* TAMPILAN SUKSES (GANTI ALERT JADUL) */
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center p-12 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.2, 1] }}
                                            transition={{ duration: 0.5 }}
                                            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]"
                                        >
                                            <CheckCircle2 size={48} />
                                        </motion.div>
                                        <h3 className="text-2xl font-bold text-[#1E1B18]">
                                            Pesanan Disajikan!
                                        </h3>
                                        <p className="mt-3 text-[#52443F]">
                                            Dapur telah menyelesaikan tugasnya.
                                            Status meja tetap{" "}
                                            <span className="font-bold text-[#6B3E2E]">
                                                Terisi
                                            </span>{" "}
                                            sampai tamu pulang.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL POP-UP KONFIRMASI CUSTOM (CHECKOUT/CHECKIN/BATAL) */}
            <AnimatePresence>
                {confirmPopup.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="p-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8F5] text-[#6B3E2E]">
                                    {confirmPopup.action === "checkout" ? (
                                        <CheckCircle2 size={32} />
                                    ) : confirmPopup.action === "cancel" ? (
                                        <XCircle size={32} />
                                    ) : (
                                        <CheckCircle2 size={32} />
                                    )}
                                </div>
                                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                    Konfirmasi Aksi
                                </h3>
                                <p className="mt-2 text-sm text-[#52443F]">
                                    {confirmPopup.message}
                                </p>
                            </div>

                            <div className="flex gap-3 bg-[#F5ECE7] p-5">
                                <button
                                    onClick={() =>
                                        setConfirmPopup({
                                            isOpen: false,
                                            id: null,
                                            action: null,
                                            message: "",
                                        })
                                    }
                                    className="w-full rounded-xl border border-[#D6C2BC] bg-white py-3 text-sm font-bold text-[#52443F] transition hover:bg-[#EAE0DA]"
                                >
                                    Kembali
                                </button>
                                <button
                                    onClick={executeUpdateStatus}
                                    className={`w-full rounded-xl py-3 text-sm font-bold text-white transition shadow-md ${
                                        confirmPopup.action === "cancel"
                                            ? "bg-[#C62828] hover:bg-[#b71c1c]"
                                            : "bg-[#6B3E2E] hover:bg-[#52443F]"
                                    }`}
                                >
                                    Ya, Lanjutkan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
