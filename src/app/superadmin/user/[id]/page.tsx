"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    User,
    Mail,
    Shield,
    ShieldAlert,
    Clock,
    Edit,
} from "lucide-react";
import Swal from "sweetalert2";

export default function DetailUserPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
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
                if (data.success) setUser(data.data);
            } catch (error) {
                Swal.fire("Error!", "Gagal memuat data dari server.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    if (isLoading)
        return (
            <div className="text-center py-20 font-medium text-[#84746E]">
                Memuat profil...
            </div>
        );
    if (!user)
        return (
            <div className="text-center py-20 font-bold">
                User Tidak Ditemukan
            </div>
        );

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/superadmin/user")}
                        className="p-2 border border-[#E9E1DC] bg-white rounded-xl text-gray-500 hover:text-[#50281A] transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1E1B18]">
                        Profil Pengguna
                    </h2>
                </div>
                <button
                    onClick={() => router.push(`/superadmin/user/${id}/edit`)}
                    className="flex items-center gap-2 bg-white border border-[#D6C2BC] text-[#50281A] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                    <Edit size={16} /> Edit Akses
                </button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E9E1DC] pb-6 md:pb-0 md:pr-6">
                    <div className="w-20 h-20 rounded-full bg-[#50281A] text-white flex items-center justify-center font-bold text-2xl shadow-inner mb-3">
                        {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === "active" || user.status === "Aktif" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                        {user.status === "active" || user.status === "Aktif"
                            ? "Aktif"
                            : "Suspend"}
                    </span>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div>
                        <p className="text-xs font-bold text-[#84746E] uppercase">
                            Nama Lengkap
                        </p>
                        <p className="font-semibold text-lg text-[#1E1B18] flex items-center gap-2 mt-0.5">
                            <User size={16} className="text-gray-400" />{" "}
                            {user.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#84746E] uppercase">
                            Alamat Email
                        </p>
                        <p className="font-semibold text-[#1E1B18] flex items-center gap-2 mt-0.5">
                            <Mail size={16} className="text-gray-400" />{" "}
                            {user.email}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Peran Sistem
                            </p>
                            <p className="font-bold text-[#50281A] flex items-center gap-1.5 mt-0.5">
                                <Shield size={16} className="text-[#50281A]" />{" "}
                                {user.role === "superadmin"
                                    ? "Super Admin"
                                    : user.role === "adminresto"
                                      ? "Resto Owner"
                                      : "Customer"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Login Terakhir
                            </p>
                            <p className="font-semibold text-gray-600 flex items-center gap-1.5 mt-0.5">
                                <Clock size={16} className="text-gray-400" />{" "}
                                {user.last_login_at
                                    ? new Date(
                                          user.last_login_at,
                                      ).toLocaleString("id-ID")
                                    : "Belum pernah"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
