"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Save,
    Store,
    MapPin,
    Clock,
    Image as ImageIcon,
    FileText,
} from "lucide-react";
import Swal from "sweetalert2";

export default function TambahRestoranPage() {
    const router = useRouter();
    // State untuk menyimpan daftar Admin Resto
    const [owners, setOwners] = useState<any[]>([]);

    // Fetch data pemilik saat halaman pertama kali dibuka
    useEffect(() => {
        const fetchOwners = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/superadmin/list-owners`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                const data = await response.json();
                if (data.success) {
                    setOwners(data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data pemilik:", error);
            }
        };
        fetchOwners();
    }, []);
    const [isLoading, setIsLoading] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // FUNGSI INI UNTUK HANDLE UPLOAD & PREVIEW
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // Bikin URL sementara untuk preview
        }
    };

    // State untuk menampung inputan form
    const [formData, setFormData] = useState({
        name: "",
        user_id: "",
        category: "Restorant", 
        price_range: "$$",
        status: "open", // open atau closed
        address: "",
        description: "",
        open_time: "09:00",
        close_time: "22:00",
        time_interval: 60,
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            // 1. Munculkan Loading Animasi Keren
            Swal.fire({
                title: "Menyimpan...",
                text: "Sedang memproses data restoran.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("user_id", formData.user_id);
            submitData.append("category", formData.category);
            submitData.append("price_range", formData.price_range);
            submitData.append("status", formData.status);
            submitData.append("address", formData.address);
            submitData.append("description", formData.description);
            submitData.append("open_time", formData.open_time);
            submitData.append("close_time", formData.close_time);
            submitData.append(
                "time_interval",
                formData.time_interval.toString(),
            );

            if (imageFile) {
                submitData.append("image", imageFile);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/superadmin/restaurants`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: submitData,
                },
            );

            const res = await response.json();

            // 2. Jika Berhasil Disimpan
            if (response.ok && res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Berhasil!",
                    text: "Restoran baru berhasil ditambahkan.",
                    confirmButtonColor: "#50281A",
                }).then(() => {
                    router.push("/superadmin/restoran"); // Pindah halaman setelah diklik OK
                });
            }
            // 3. Jika Ada Error dari Laravel (Validasi DB / Kolom Salah)
            else {
                // Tangkap pesan error aslinya!
                const errorMsg =
                    res.message ||
                    "Gagal menyimpan data restoran. Cek kembali isian Anda.";
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: errorMsg,
                    confirmButtonColor: "#50281A",
                });
            }
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Gagal menghubungi server database.",
                confirmButtonColor: "#50281A",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                            Tambah Restoran Baru
                        </h2>
                        <p className="text-sm text-[#84746E] mt-0.5">
                            Isi formulir di bawah ini untuk mendaftarkan mitra
                            restoran.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-[#50281A] text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-[#3A1D13] disabled:opacity-70 disabled:cursor-not-allowed transition w-full md:w-auto"
                >
                    {isLoading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                        <Save size={18} />
                    )}
                    {isLoading ? "Menyimpan..." : "Simpan Restoran"}
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
            >
                {/* KOLOM KIRI (LEBIH LEBAR UNTUK INFO UTAMA) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* CARD 1: INFORMASI DASAR */}
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
                                    placeholder="Contoh: Osteria Francescana"
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
                                        {/* OPSI KATEGORI  */}
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
                        {/* SUNTIKKAN DROPDOWN INI DI BAWAH NAMA RESTORAN */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                Pemilih Restoran (Admin Resto){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="user_id"
                                required
                                value={formData.user_id}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition cursor-pointer"
                            >
                                <option value="" disabled>
                                    -- Pilih Akun Pemilik --
                                </option>
                                {owners.map((owner: any) => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name} ({owner.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* CARD 2: LOKASI & DESKRIPSI */}
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
                                    placeholder="Tuliskan alamat lengkap restoran..."
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
                                    placeholder="Ceritakan keunikan dan daya tarik restoran ini..."
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN (LEBIH KECIL UNTUK PENGATURAN TAMBAHAN) */}
                <div className="space-y-6">
                    {/* CARD 3: STATUS & WAKTU */}
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

                            <div>
                                <label className="block text-sm font-bold text-[#52443F] mb-1.5">
                                    Interval Reservasi (Menit)
                                </label>
                                <input
                                    type="number"
                                    name="time_interval"
                                    value={formData.time_interval}
                                    onChange={handleChange}
                                    min="15"
                                    step="15"
                                    className="w-full bg-gray-50 border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CARD 4: MEDIA / GAMBAR UTAMA */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E9E1DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#E9E1DC] pb-4">
                            <ImageIcon className="text-[#50281A]" size={20} />
                            <h3 className="text-lg font-bold text-[#1E1B18]">
                                Gambar Utama
                            </h3>
                        </div>

                        {/* Input file asli disembunyikan (hidden) */}
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                            onChange={handleImageChange}
                        />

                        {/* Label ini bertindak sebagai tombol yang memicu input file */}
                        <label
                            htmlFor="imageUpload"
                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-[#50281A] transition overflow-hidden relative"
                        >
                            {imagePreview ? (
                                // Kalau ada gambar, tampilkan gambarnya full
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                // Kalau kosong, tampilkan icon default
                                <>
                                    <ImageIcon
                                        size={32}
                                        className="text-gray-400 mb-2"
                                    />
                                    <span className="text-sm font-medium text-gray-500">
                                        Klik untuk upload foto
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        PNG, JPG up to 2MB
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
