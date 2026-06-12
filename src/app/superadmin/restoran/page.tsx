"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
    Search,
    Plus,
    ChevronDown,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function ManajemenRestoranPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [restaurants, setRestaurants] = useState<any[]>([]);

    // State Filter & Tracker Informasi Pagination dari Backend
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("Semua Status");
    const [category, setCategory] = useState("Semua Kategori");
    const [pagination, setPagination] = useState({
        total: 0,
        from: 0,
        to: 0,
        last_page: 1,
    });

    // Pemicu Fetch Data Riil Terintegrasi Filter & Pagination
    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants`,
                );

                // Masukkan parameter query untuk diolah di Controller Laravel
                url.searchParams.append("page", currentPage.toString());
                url.searchParams.append("search", search);
                url.searchParams.append("status", status);
                url.searchParams.append("category", category);

                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (data.success) {
                    setRestaurants(data.data.data);
                    setPagination({
                        total: data.data.total,
                        from: data.data.from,
                        to: data.data.to,
                        last_page: data.data.last_page,
                    });
                }
            } catch (error) {
                console.error("Gagal menarik data restoran:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce kecil agar tidak spam query ke MySQL setiap ketikan huruf
        const delayDebounceFn = setTimeout(() => {
            fetchRestaurants();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, search, status, category]);

    // Helper anti-nyasar untuk merakit URL gambar
    const getImageUrl = (imagePath: string) => {
        if (!imagePath)
            return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80";
        // Kalau dari sananya sudah ada http (misal dari Vercel/Cloudinary), langsung pakai
        if (imagePath.startsWith("http")) return imagePath;

        // Hapus kata '/api' di belakang URL jika ada, lalu sambungkan ke folder storage
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(
            /\/api$/,
            "",
        );
        return `${baseUrl}/storage/${imagePath}`;
    };

    // Helper untuk warna badge status
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]";
            case "Aktif":
                return "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]";
            case "Nonaktif":
                return "bg-[#F5F5F5] text-[#757575] border-[#E0E0E0]";
            default:
                return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };
    const handleDetail = (id: number) => {
        router.push(`/superadmin/restoran/${id}`);
    };

    const handleEdit = (id: number) => {
        router.push(`/superadmin/restoran/${id}/edit`);
    };

    const handleApprove = async (id: number) => {
        // Alert simpel bawaan SweetAlert
        const result = await Swal.fire({
            title: "Setujui Restoran?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, Setujui",
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants/${id}/approve`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    },
                );
                const data = await response.json();

                if (data.success) {
                    setRestaurants(
                        restaurants.map((r) =>
                            r.id === id ? { ...r, status: "Aktif" } : r,
                        ),
                    );
                    Swal.fire(
                        "Berhasil!",
                        "Restoran telah disetujui.",
                        "success",
                    );
                }
            } catch (error) {
                Swal.fire("Error!", "Terjadi kesalahan pada server.", "error");
            }
        }
    };

    const handleDelete = async (id: number) => {
        // Alert simpel bawaan SweetAlert
        const result = await Swal.fire({
            title: "Hapus Restoran?",
            text: "Data tidak dapat dikembalikan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Hapus",
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants/${id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    },
                );
                const data = await response.json();

                if (data.success) {
                    setRestaurants(restaurants.filter((r) => r.id !== id));
                    Swal.fire(
                        "Terhapus!",
                        "Restoran telah dihapus.",
                        "success",
                    );
                }
            } catch (error) {
                Swal.fire("Error!", "Terjadi kesalahan pada server.", "error");
            }
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
                        Manajemen Restoran
                    </h2>
                    <p className="text-sm text-[#84746E] mt-0.5">
                        Kelola pendaftaran, status, dan data mitra restoran.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/superadmin/restoran/create")}
                    className="flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] transition w-full md:w-auto"
                >
                    <Plus size={18} />
                    Tambah Manual
                </button>
            </div>

            {/* FILTER SECTION */}
            <div className="bg-white p-4 rounded-2xl border border-[#E9E1DC] shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-4">
                <div className="relative w-full md:w-48">
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-[#52443F] text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                    >
                        <option>Semua Status</option>
                        <option>Pending</option>
                        <option>Aktif</option>
                        <option>Nonaktif</option>
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                </div>

                <div className="relative w-full md:w-48">
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-[#52443F] text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                    >
                        <option value="Semua Kategori">Semua Kategori</option>
                        {/* opsi kategori */}
                        <option value="Restorant">Restorant</option>
                        <option value="Cafe & Coffee Shop">
                            Cafe & Coffee Shop
                        </option>
                        <option value="Seafood">Seafood</option>
                        <option value="Vegetarian">Vegetarian</option>
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                </div>

                {/* Search Bar */}
                <div className="relative w-full flex-1">
                    <Search
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Cari nama restoran, ID, atau lokasi..."
                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                    />
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="bg-white border border-[#E9E1DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4 w-1/3">
                                    Nama Restoran
                                </th>
                                <th className="px-6 py-4">Lokasi</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Tanggal Daftar</th>
                                <th className="px-6 py-4 text-center">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            {restaurants.length > 0 ? (
                                restaurants.map((resto) => (
                                    <tr
                                        key={resto.id}
                                        className="hover:bg-gray-50/50 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={getImageUrl(
                                                        resto.image,
                                                    )}
                                                    alt={resto.nama}
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                                    onError={(e) => {
                                                        // Jika masih gagal dimuat, ganti ke gambar default
                                                        e.currentTarget.src =
                                                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80";
                                                    }}
                                                />
                                                <div>
                                                    <div className="font-bold text-[#1E1B18] text-base">
                                                        {resto.nama}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5">
                                                        ID: {resto.kode}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-[#52443F]">
                                            {resto.lokasi}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-3 py-1 bg-[#F5ECE7] text-[#52443F] rounded-full text-xs font-bold">
                                                {resto.kategori}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {resto.tanggal}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(resto.status)}`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                                                {resto.status}
                                            </span>
                                        </td>
                                        {/* Kolom Aksi (Tombol Ikon) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Tombol View */}
                                                <button
                                                    onClick={() =>
                                                        handleDetail(resto.id)
                                                    }
                                                    title="Detail Restoran"
                                                    className="p-1.5 text-gray-400 hover:text-[#50281A] hover:bg-[#F5ECE7] rounded-lg transition"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {/* Tombol Edit */}
                                                <button
                                                    onClick={() =>
                                                        handleEdit(resto.id)
                                                    }
                                                    title="Edit Data"
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit size={18} />
                                                </button>

                                                {/* Tombol Khusus Approve (Hanya muncul jika Pending) */}
                                                {resto.status === "Pending" ? (
                                                    <button
                                                        onClick={() =>
                                                            handleApprove(
                                                                resto.id,
                                                            )
                                                        }
                                                        title="Setujui Pendaftaran"
                                                        className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                                    >
                                                        <CheckCircle
                                                            size={18}
                                                        />
                                                    </button>
                                                ) : (
                                                    /* Tombol Hapus */
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                resto.id,
                                                            )
                                                        }
                                                        title="Hapus Restoran"
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-gray-500 font-medium"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-[#50281A] border-t-transparent rounded-full"></span>
                                                Memuat data mitra restoran...
                                            </span>
                                        ) : (
                                            "Tidak ada data restoran yang ditemukan."
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION SECTION */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E9E1DC] px-5 md:px-6 py-4 bg-white gap-4">
                    <span className="text-xs md:text-sm text-[#84746E] font-medium">
                        Menampilkan{" "}
                        <strong className="text-[#1E1B18]">
                            {pagination.from || 0}-{pagination.to || 0}
                        </strong>{" "}
                        dari{" "}
                        <strong className="text-[#1E1B18]">
                            {pagination.total}
                        </strong>{" "}
                        restoran
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

                        <button className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold border border-[#D6C2BC] bg-[#F5ECE7] text-[#50281A]">
                            {currentPage}
                        </button>

                        <button
                            disabled={
                                currentPage === pagination.last_page ||
                                pagination.last_page === 0
                            }
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, pagination.last_page),
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
