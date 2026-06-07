"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Save,
    Store,
    MapPin,
    Clock,
    Image as ImageIcon,
} from "lucide-react";
import Swal from "sweetalert2";

export default function EditRestoranPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State form
    const [formData, setFormData] = useState({
        name: "",
        category: "Restorant",
        price_range: "$$",
        status: "open",
        address: "",
        description: "",
        open_time: "",
        close_time: "",
        time_interval: 60,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Fetch data lama saat halaman pertama kali dibuka
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants/${id}`,
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
                    const resto = data.data;
                    setFormData({
                        name: resto.name || "",
                        category: resto.category || "Restorant",
                        price_range: resto.price_range || "$$",
                        status: resto.status || "open",
                        address: resto.address || "",
                        description: resto.description || "",
                        open_time: resto.open_time || "",
                        close_time: resto.close_time || "",
                        time_interval: resto.time_interval || 60,
                    });

                    if (resto.image) {
                        setImagePreview(
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${resto.image}`,
                        );
                    }
                }
            } catch (error) {
                console.error("Gagal menarik data restoran:", error);
                Swal.fire("Error!", "Gagal memuat data dari server.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");

            // Gunakan FormData karena kita mengirim file (gambar)
            const formDataToSend = new FormData();

            // Masukkan semua data teks ke FormData
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value as string);
            });

            // Masukkan file gambar jika ada yang baru dipilih
            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            // Tembak API Backend Laravel
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants/${id}`,
                {
                    method: "POST", // Menggunakan POST untuk kirim gambar
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataToSend,
                },
            );

            const data = await response.json();

            if (data.success) {
                Swal.fire(
                    "Berhasil!",
                    "Data restoran berhasil diperbarui.",
                    "success",
                ).then(() => {
                    router.push(`/superadmin/restoran/${id}`); // Auto kembali ke halaman detail
                });
            } else {
                Swal.fire(
                    "Gagal!",
                    data.message || "Gagal update data.",
                    "error",
                );
            }
        } catch (error) {
            console.error("Gagal update restoran:", error);
            Swal.fire(
                "Error!",
                "Terjadi kesalahan pada server saat menyimpan.",
                "error",
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="animate-spin h-8 w-8 border-4 border-[#50281A] border-t-transparent rounded-full"></div>
                <p className="text-[#84746E] font-medium animate-pulse">
                    Memuat data restoran...
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-10"
        >
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 border border-[#E9E1DC] bg-white rounded-xl text-gray-500 hover:text-[#50281A] hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B18]">
                            Edit Restoran
                        </h2>
                        <p className="text-sm text-[#84746E] mt-0.5">
                            Perbarui informasi mitra restoran.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] disabled:opacity-70 disabled:cursor-not-allowed transition w-full md:w-auto"
                >
                    {isSaving ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                        <Save size={18} />
                    )}
                    {isSaving ? "Menyimpan..." : "Update Restoran"}
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
            >
                {/* KOLOM KIRI */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <Store className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Informasi Dasar
                            </h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                    Nama Restoran{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                        Kategori
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                    >
                                        {/* OPSI KATEGORI */}
                                        <option value="Restorant">
                                            Restorant
                                        </option>
                                        <option value="Cafe & Coffee Shop">
                                            Cafe & Coffee Shop
                                        </option>
                                        <option value="Seafood">Seafood</option>
                                        <option value="Vegetarian">
                                            Vegetarian
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                        Range Harga
                                    </label>
                                    <select
                                        name="price_range"
                                        value={formData.price_range}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                                    >
                                        {/* Value yang masuk ke DB adalah $, $$, $$$, tapi teks yang dibaca Super Admin adalah Rupiah */}
                                        <option value="$">
                                            Murah (&lt; Rp 50rb)
                                        </option>
                                        <option value="$$">
                                            Menengah (Rp 50rb - Rp 100rb)
                                        </option>
                                        <option value="$$$">
                                            Mahal (&gt; Rp 200rb)
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <MapPin className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Lokasi & Deskripsi
                            </h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    name="address"
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                    Deskripsi Singkat
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <Clock className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Operasional
                            </h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                    Status Pendaftaran
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                >
                                    <option value="open">Aktif (Open)</option>
                                    <option value="closed">
                                        Nonaktif (Closed)
                                    </option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                        Jam Buka
                                    </label>
                                    <input
                                        type="time"
                                        name="open_time"
                                        value={formData.open_time}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                        Jam Tutup
                                    </label>
                                    <input
                                        type="time"
                                        name="close_time"
                                        value={formData.close_time}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <ImageIcon className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Gambar Utama
                            </h3>
                        </div>

                        <input
                            type="file"
                            id="imageEdit"
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                            onChange={handleImageChange}
                        />

                        <label
                            htmlFor="imageEdit"
                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-[#50281A] transition overflow-hidden relative"
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <>
                                    <ImageIcon
                                        size={32}
                                        className="text-gray-400 mb-2"
                                    />
                                    <span className="text-sm font-medium text-gray-500">
                                        Ganti Foto
                                    </span>
                                </>
                            )}
                        </label>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
