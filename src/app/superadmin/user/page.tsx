"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Search,
    Plus,
    ChevronDown,
    Eye,
    Edit,
    Lock,
    Unlock,
    Trash2,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
} from "lucide-react";
import Swal from "sweetalert2";

export default function ManajemenUserPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    // Menyimpan ID user yang sedang login saat ini
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        // Ambil data user dari localStorage (asumsi bosku menyimpan data user saat login)
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setCurrentUserId(userData.id);
            } catch (e) {
                console.error("Gagal membaca data user aktif");
            }
        }
    }, []);

    // State Filter & Pagination Tracker
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("Semua Peran");
    const [statusFilter, setStatusFilter] = useState("Semua Status");
    const [pagination, setPagination] = useState({
        total: 0,
        from: 0,
        to: 0,
        last_page: 1,
    });

    // Fetch Data User Terintegrasi Backend Laravel
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users`
                );

                url.searchParams.append("page", currentPage.toString());
                url.searchParams.append("search", search);
                url.searchParams.append("role", roleFilter);
                url.searchParams.append("status", statusFilter);

                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (data.success) {
                    setUsers(data.data.data);
                    setPagination({
                        total: data.data.total,
                        from: data.data.from,
                        to: data.data.to,
                        last_page: data.data.last_page,
                    });
                }
            } catch (error) {
                console.error("Gagal memuat data user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, search, roleFilter, statusFilter]);

    // Helper 1: Konversi Role DB ke Label Cantik (Poin 3 diskusi)
    const getRoleLabel = (role: string) => {
        switch (role) {
            case "superadmin":
                return "Super Admin";
            case "adminresto":
                return "Resto Owner";
            case "customer":
                return "Customer";
            default:
                return role;
        }
    };

    // Styling Badge Role sesuai Desain Mockup
    const getRoleStyle = (role: string) => {
        switch (role) {
            case "superadmin":
                return "bg-[#50281A] text-white";
            case "adminresto":
                return "bg-[#F5ECE7] text-[#50281A]";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // Helper 2: Styling Badge Status (Aktif / Suspend)
    const getStatusStyle = (status: string) => {
        return status === "Aktif" || status === "active"
            ? "bg-[#E8F5E9] text-[#2E7D32]"
            : "bg-[#FFEBEE] text-[#C62828]";
    };

    // handler Fungsional Tombol Aksi (Poin 1 diskusi)
    const handleDetail = (id: number) => {
        router.push(`/superadmin/user/${id}`);
    };

    // Helper 3: Konversi Waktu menjadi "Time Ago" (Misal: 2 jam yang lalu)
    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return "Belum pernah login";

        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) return "Baru saja";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
        if (diffInSeconds < 172800) return "Kemarin";

        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const handleEdit = (id: number) => {
        router.push(`/superadmin/user/${id}/edit`);
    };

    const handleToggleStatus = async (id: number, currentStatus: string) => {
        const isSuspend =
            currentStatus === "Aktif" || currentStatus === "active";
        const actionText = isSuspend ? "men-suspend" : "mengaktifkan";

        const result = await Swal.fire({
            title: `${isSuspend ? "Suspend" : "Aktifkan"} Pengguna?`,
            text: `Apakah bosku yakin ingin ${actionText} akun ini?`,
            icon: isSuspend ? "warning" : "question",
            showCancelButton: true,
            confirmButtonText: "Ya, Eksekusi",
            cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users/${id}/toggle-status`,
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
                    setUsers(
                        users.map((u) =>
                            u.id === id
                                ? {
                                      ...u,
                                      status: isSuspend ? "Suspend" : "Aktif",
                                  }
                                : u,
                        ),
                    );
                    Swal.fire(
                        "Berhasil!",
                        `Status pengguna berhasil diperbarui.`,
                        "success",
                    );
                }
            } catch (error) {
                Swal.fire("Error!", "Terjadi kesalahan pada server.", "error");
            }
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Hapus Permanen?",
            text: "Akun pengguna ini akan dilenyapkan dari sistem!",
            icon: "error", // Icon merah
            showCancelButton: true,
            confirmButtonColor: "#93000A", // Merah gelap
            cancelButtonColor: "#84746E",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users/${id}`,
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
                    setUsers(users.filter((u) => u.id !== id));
                    Swal.fire(
                        "Terhapus!",
                        "Pengguna berhasil dihapus permanen.",
                        "success",
                    );
                } else {
                    Swal.fire("Gagal!", data.message, "error");
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
                        Manajemen User
                    </h2>
                    <p className="text-sm text-[#84746E] mt-0.5">
                        Kelola akses, peran, dan status pengguna sistem.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/superadmin/user/create")}
                    className="flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] transition w-full md:w-auto"
                >
                    <Plus size={18} />
                    Tambah User
                </button>
            </div>

            {/* FILTER SECTION */}
            <div className="bg-white p-4 rounded-2xl border border-[#E9E1DC] shadow-sm flex flex-col lg:flex-row items-center gap-3 md:gap-4">
                {/* Search Input */}
                <div className="relative w-full lg:flex-1">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Cari nama atau email..."
                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                    />
                </div>

                {/* Dropdowns & Advanced Button */}
                <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 w-full">
                    <div className="relative w-full sm:w-44">
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-[#52443F] text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#50281A] transition cursor-pointer"
                        >
                            <option>Semua Peran</option>
                            <option value="superadmin">Super Admin</option>
                            <option value="adminresto">Resto Owner</option>
                            <option value="customer">Customer</option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                    </div>

                    <div className="relative w-full sm:w-44">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 text-[#52443F] text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#50281A] transition cursor-pointer"
                        >
                            <option>Semua Status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Suspend">Suspend</option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="bg-white border border-[#E9E1DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[950px]">
                        <thead className="bg-[#FFF8F5] text-xs font-bold uppercase tracking-wider text-[#84746E] border-b border-[#E9E1DC]">
                            <tr>
                                <th className="px-6 py-4 w-1/4">
                                    Nama Lengkap
                                </th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Peran</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Login Terakhir</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1DC]">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50/50 transition"
                                    >
                                        {/* Avatar & Nama */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#50281A] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-inner">
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name
                                                            .substring(0, 2)
                                                            .toUpperCase()
                                                    )}
                                                </div>
                                                <div className="font-bold text-[#1E1B18] text-sm">
                                                    {user.name}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4 font-medium text-gray-600">
                                            {user.email}
                                        </td>

                                        {/* Peran / Role */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getRoleStyle(user.role)}`}
                                            >
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(user.status)}`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {user.status === "active"
                                                    ? "Aktif"
                                                    : user.status}
                                            </span>
                                        </td>

                                        {/* Login Terakhir */}
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {formatTimeAgo(user.last_login_at)}
                                        </td>

                                        {/* Kolom Aksi Dinamis */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() =>
                                                        handleDetail(user.id)
                                                    }
                                                    title="Detail User"
                                                    className="p-1.5 text-gray-400 hover:text-[#50281A] hover:bg-[#F5ECE7] rounded-lg transition"
                                                >
                                                    <Eye size={17} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(user.id)
                                                    }
                                                    title="Edit Akses"
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit size={17} />
                                                </button>

                                                {/* Tombol Suspend / Aktifkan */}
                                                {/* Tombol Suspend / Aktifkan */}
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            user.id,
                                                            user.status,
                                                        )
                                                    }
                                                    disabled={
                                                        user.id ===
                                                        currentUserId
                                                    }
                                                    title={
                                                        user.id ===
                                                        currentUserId
                                                            ? "Aman coy! Tidak bisa suspend akun sendiri" // Tooltip pencegah
                                                            : user.status ===
                                                                    "Aktif" ||
                                                                user.status ===
                                                                    "active"
                                                              ? "Suspend User"
                                                              : "Aktifkan User"
                                                    }
                                                    className={`p-1.5 rounded-lg transition ${
                                                        user.id ===
                                                        currentUserId
                                                            ? "text-gray-300 cursor-not-allowed opacity-40" // Redup jika akun sendiri
                                                            : user.status ===
                                                                    "Aktif" ||
                                                                user.status ===
                                                                    "active"
                                                              ? "text-green-600 hover:bg-green-50"
                                                              : "text-red-600 hover:bg-red-50"
                                                    }`}
                                                >
                                                    {user.status === "Aktif" ||
                                                    user.status === "active" ? (
                                                        <Unlock size={17} />
                                                    ) : (
                                                        <Lock size={17} />
                                                    )}
                                                </button>

                                                {/* Tombol Hapus */}
                                                <button
                                                    onClick={() =>
                                                        handleDelete(user.id)
                                                    }
                                                    disabled={
                                                        user.id ===
                                                        currentUserId
                                                    }
                                                    title={
                                                        user.id ===
                                                        currentUserId
                                                            ? "Aman coy! Tidak bisa hapus akun sendiri"
                                                            : "Hapus User"
                                                    }
                                                    className={`p-1.5 rounded-lg transition ${
                                                        user.id ===
                                                        currentUserId
                                                            ? "text-gray-300 cursor-not-allowed opacity-40" // Redup jika akun sendiri
                                                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                    }`}
                                                >
                                                    <Trash2 size={17} />
                                                </button>
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
                                                Memuat data sistem pengguna...
                                            </span>
                                        ) : (
                                            "Tidak ada data pengguna yang ditemukan."
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
                        hasil
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
