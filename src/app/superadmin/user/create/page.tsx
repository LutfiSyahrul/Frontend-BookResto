"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    Lock,
    Shield,
    CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function TambahUserPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer",
        status: "active",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                },
            );

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: "Berhasil!",
                    text: "Pengguna baru berhasil ditambahkan ke sistem.",
                    icon: "success",
                    confirmButtonColor: "#50281A",
                }).then(() => {
                    router.push("/superadmin/user");
                });
            } else {
                // Menampilkan pesan error dari validasi Laravel
                const errorMsg =
                    data.message || "Terjadi kesalahan saat menyimpan data.";
                Swal.fire("Gagal!", errorMsg, "error");
            }
        } catch (error) {
            console.error("Gagal menambah user:", error);
            Swal.fire("Error!", "Terjadi kesalahan pada server.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto space-y-6 pb-10"
        >
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/superadmin/user")}
                        className="p-2 border border-[#E9E1DC] bg-white rounded-xl text-gray-500 hover:text-[#50281A] hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#1E1B18]">
                            Tambah User Baru
                        </h2>
                        <p className="text-sm text-[#84746E] mt-0.5">
                            Daftarkan pengguna baru ke dalam sistem.
                        </p>
                    </div>
                </div>
            </div>

            {/* FORM SECTION */}
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm space-y-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* KOLOM KIRI: INFO DASAR */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-2 border-b border-[#E9E1DC] pb-3">
                            <User className="text-[#50281A]" size={18} />
                            <h3 className="font-bold text-[#1E1B18]">
                                Informasi Akun
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Nama Lengkap{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Masukkan nama lengkap"
                                className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Alamat Email{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="contoh@email.com"
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Password Sementara{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                />
                            </div>
                        </div>
                    </div>
                    

                    {/* KOLOM KANAN: HAK AKSES */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-2 border-b border-[#E9E1DC] pb-3">
                            <Shield className="text-[#50281A]" size={18} />
                            <h3 className="font-bold text-[#1E1B18]">
                                Hak Akses & Status
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Peran (Role){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                            >
                                <option value="customer">Customer</option>
                                <option value="adminresto">Resto Owner</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Status Awal{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label
                                    className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2.5 cursor-pointer transition ${formData.status === "active" ? "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value="active"
                                        checked={formData.status === "active"}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <CheckCircle size={18} />
                                    <span className="text-sm font-bold">
                                        Aktif
                                    </span>
                                </label>
                                <label
                                    className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2.5 cursor-pointer transition ${formData.status === "suspend" ? "bg-[#FFEBEE] border-[#C62828] text-[#C62828]" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value="suspend"
                                        checked={formData.status === "suspend"}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <Lock size={18} />
                                    <span className="text-sm font-bold">
                                        Suspend
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TOMBOL SUBMIT */}
                <div className="pt-4 border-t border-[#E9E1DC] flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold px-8 py-3 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] disabled:opacity-70 transition w-full md:w-auto"
                    >
                        {isSaving ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <Save size={18} />
                        )}
                        {isSaving
                            ? "Menyimpan Data..."
                            : "Simpan Pengguna Baru"}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
