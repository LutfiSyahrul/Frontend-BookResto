"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import Swal from "sweetalert2";

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "customer",
        status: "active",
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users/${id}`,
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
                    setFormData({
                        name: data.data.name,
                        email: data.data.email,
                        role: data.data.role,
                        status: data.data.status,
                    });
                }
            } catch (error) {
                Swal.fire("Error", "Gagal mengambil data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchUser();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users/${id}`,
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
                Swal.fire(
                    "Berhasil!",
                    "Akses pengguna berhasil diperbarui.",
                    "success",
                ).then(() => {
                    router.push("/superadmin/user");
                });
            }
        } catch (error) {
            Swal.fire("Error", "Gagal menyimpan perubahan", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading)
        return (
            <div className="text-center py-20 text-[#84746E]">
                Memuat data akses...
            </div>
        );

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 border border-[#E9E1DC] bg-white rounded-xl text-gray-500 hover:text-[#50281A] transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-[#1E1B18]">
                    Edit Hak Akses
                </h2>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm space-y-5"
            >
                <div>
                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                        Nama Lengkap
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                            Peran (Role)
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    role: e.target.value,
                                })
                            }
                            className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition cursor-pointer"
                        >
                            <option value="superadmin">Super Admin</option>
                            <option value="adminresto">Resto Owner</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                            Status Akun
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value,
                                })
                            }
                            className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition cursor-pointer"
                        >
                            <option value="active">Aktif</option>
                            <option value="suspend">Suspend</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold py-3 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] disabled:opacity-70 transition mt-6"
                >
                    {isSaving ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                        <Save size={18} />
                    )}
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </form>
        </motion.div>
    );
}
