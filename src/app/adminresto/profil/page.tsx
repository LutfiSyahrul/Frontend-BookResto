"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    MapPin,
    Clock,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Camera,
    Image as ImageIcon,
    Trash2, 
} from "lucide-react";


export default function ProfilRestoranPage() {
    const [activeTab, setActiveTab] = useState("umum");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error";
    }>({ show: false, message: "", type: "success" });

    // State untuk form sesuai dengan struktur DB
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price_range: "",
        address: "",
        description: "",
        open_time: "",
        close_time: "",
        time_interval: 60,
        status: "open",
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [existingGalleries, setExistingGalleries] = useState<any[]>([]);

    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

    // State untuk mengontrol pop-up hapus
    const [deleteModal, setDeleteModal] = useState<{
        show: boolean;
        id: number | null;
    }>({ show: false, id: null });

    // 2. Fungsi Hapus Foto Galeri
    const handleDeleteGallery = async (id: number) => {

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/profil/galeri/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();
            if (data.success) {
                showToast("Foto berhasil dihapus!", "success");
                setExistingGalleries(
                    existingGalleries.filter((img) => img.id !== id),
                );

                // BARIS UNTUK MENUTUP MODAL SAAT SUKSES 
                setDeleteModal({ show: false, id: null });
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Gagal menghapus foto.", "error");
        }
    };

    // Tarik data profil saat halaman pertama kali diload
    useEffect(() => {
        const fetchProfil = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/profil`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();
                if (data.success && data.data) {
                    setFormData({
                        name: data.data.name || "",
                        category: data.data.category || "Restorant",
                        price_range: data.data.price_range || "",
                        address: data.data.address || "",
                        description: data.data.description || "",
                        // Memasastikan potong datanya jadi 5 karakter awal saja (09:00) bukan format lengkap (09:00:00)
                        open_time: data.data.open_time
                            ? data.data.open_time.substring(0, 5)
                            : "",
                        close_time: data.data.close_time
                            ? data.data.close_time.substring(0, 5)
                            : "",
                        time_interval: data.data.time_interval || 60,
                        status: data.data.status || "open",
                    });
                    setExistingGalleries(data.data.galleries || []);
                    setCoverImageUrl(data.data.image || null);
                }
            } catch (error) {
                console.error("Gagal memuat profil", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfil();
    }, []);

    // Handler untuk setiap ketikan di input
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler untuk submit/simpan data (SUDAH MENDUKUNG UPLOAD FILE)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");

            // BUNGKUS DATA KE DALAM FORMDATA (KARENA ADA FILE GAMBAR)
            const payload = new FormData();

            // 1. Masukkan semua data teks ke payload
            Object.keys(formData).forEach((key) => {
                if (formData[key as keyof typeof formData] !== null) {
                    payload.append(
                        key,
                        formData[key as keyof typeof formData] as string,
                    );
                }
            });

            // 2. Masukkan file cover utama (Kalau user memilih file)
            if (coverFile) {
                payload.append("image", coverFile);
            }

            // 3. Masukkan file galeri (Karena bentuknya array, kita loop)
            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file, index) => {
                    payload.append(`gallery_images[${index}]`, file);
                });
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/profil/update`,
                {
                    method: "POST",
                    headers: {
                        // Biarkan browser yang otomatis menyeting 'multipart/form-data'
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: payload,
                },
            );

            const data = await response.json();
            if (data.success) {
                showToast("Profil restoran berhasil diperbarui!", "success");
                // Reset pilihan file setelah sukses terupload
                setCoverFile(null);
                setGalleryFiles([]);
                setCoverImageUrl(data.data.image || null);
            } else {
                let errorMessage = data.message || "Gagal memperbarui profil.";
                if (data.errors) {
                    const firstErrorKey = Object.keys(data.errors)[0];
                    errorMessage = data.errors[firstErrorKey][0];
                }
                showToast(errorMessage, "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Fungsi untuk memunculkan notifikasi Pop-up (Toast)
    const showToast = (message: string, type: "success" | "error") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "success" }),
            3000,
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 text-[#6B3E2E]">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-sm font-medium">Memuat profil restoran...</p>
            </div>
        );
    }

    const tabs = [
        { id: "umum", label: "Informasi Umum", icon: <Store size={18} /> },
        { id: "kontak", label: "Lokasi ", icon: <MapPin size={18} /> },
        {
            id: "operasional",
            label: "Waktu Operasional",
            icon: <Clock size={18} />,
        },
        { id: "galeri", label: "Galeri & Foto", icon: <ImageIcon size={18} /> },
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-8 relative">
            {/* NOTIFIKASI TOAST */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-8 right-8 z-50 flex items-center gap-3 rounded-xl px-6 py-4 shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 size={24} />
                        ) : (
                            <AlertCircle size={24} />
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER HERO SECTION (Ala Twitter/Facebook) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#F5F1E9] shadow-sm border border-[#E1D8D4]">
                <div className="h-40 w-full relative bg-[#E5E1D9] overflow-hidden">
                    {coverFile ? (
                        /* Menampilkan Live Preview foto yang baru dipilih */
                        <img
                            src={URL.createObjectURL(coverFile)}
                            alt="Preview Sampul"
                            className="h-full w-full object-cover"
                        />
                    ) : coverImageUrl ? (
                        /* Menampilkan foto yang sudah tersimpan di Database */
                        <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${coverImageUrl}`}
                            alt="Sampul Restoran"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        /* Warna Coklat Default (Jika belum pernah upload foto) */
                        <div className="h-full w-full bg-gradient-to-r from-[#50281A] to-[#84746E]"></div>
                    )}
                </div>
                <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between px-8 pb-6 -mt-16">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#FDFCFB] bg-white shadow-md">
                            <span className="text-5xl font-black text-[#6B3E2E] uppercase">
                                {formData.name ? formData.name.charAt(0) : "R"}
                            </span>
                            <button className="absolute bottom-0 right-0 rounded-full bg-[#50281A] p-2 text-white shadow-md transition hover:bg-[#6B3E2E]">
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="text-center md:text-left mt-4 md:mt-16">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                                {formData.name || "Nama Restoran"}
                            </h2>
                            <p className="text-[#84746E] font-medium">
                                {formData.category || "Kategori Belum Diatur"} •{" "}
                                {formData.status === "open"
                                    ? "🟢 Buka"
                                    : "🔴 Tutup"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col lg:flex-row gap-8"
            >
                {/* SIDEBAR TABS (Responsif) */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="flex overflow-x-auto lg:flex-col gap-2 rounded-2xl border border-[#E1D8D4] bg-[#F5F1E9] p-2 hide-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex whitespace-nowrap items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id ? "bg-white text-[#50281A] shadow-sm border border-[#E1D8D4]" : "text-[#78716C] hover:bg-[#EAE0DA]/50 hover:text-[#52443F]"}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AREA KONTEN FORM */}
                <div className="flex-1 rounded-2xl border border-[#E1D8D4] bg-[#F5F1E9] p-6 md:p-8 shadow-sm overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* TAB 1: UMUM */}
                            {activeTab === "umum" && (
                                <>
                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18] mb-6 border-b border-[#D6C2BC]/40 pb-4">
                                        Informasi Umum
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#52443F]">
                                                Nama Restoran
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition"
                                                placeholder="Contoh: CoffeeReserve Center"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#52443F]">
                                                Kategori
                                            </label>
                                            {/* mengbah menjadi dropdown */}
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full bg-white border border-[#D6C2BC] text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                                            >
                                                <option value="Restorant">
                                                    Restorant
                                                </option>
                                                <option value="Cafe & Coffee Shop">
                                                    Cafe & Coffee Shop
                                                </option>
                                                <option value="Seafood">
                                                    Seafood
                                                </option>
                                                <option value="Vegetarian">
                                                    Vegetarian
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#52443F]">
                                            Rentang Harga
                                        </label>
                                        <select
                                            name="price_range"
                                            value={formData.price_range}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-gray-200 text-[#1E1B18] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition cursor-pointer"
                                        >
                                            {/* Value yang disimpan tetap $, $$, $$$, tapi teksnya ramah untuk Admin Resto */}
                                            <option value="$">
                                                Rp (Ekonomis / Di bawah 50rb)
                                            </option>
                                            <option value="$$">
                                                Rp Rp (Menengah / 50rb - 100rb)
                                            </option>
                                            <option value="$$$">
                                                Rp Rp Rp (Eksklusif / Di atas
                                                100rb)
                                            </option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#52443F]">
                                            Deskripsi Restoran
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-3 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition resize-none"
                                            placeholder="Ceritakan keunikan restoran Anda..."
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: KONTAK */}
                            {activeTab === "kontak" && (
                                <>
                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18] mb-6 border-b border-[#D6C2BC]/40 pb-4">
                                        Lokasi
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-[#52443F]">
                                            Alamat Lengkap
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-3 text-sm outline-none focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A] transition resize-none"
                                            placeholder="Masukkan alamat lengkap restoran..."
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            {/* TAB 3: OPERASIONAL */}
                            {activeTab === "operasional" && (
                                <>
                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18] mb-6 border-b border-[#D6C2BC]/40 pb-4">
                                        Waktu Operasional
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#52443F]">
                                                Jam Buka
                                            </label>
                                            <input
                                                type="time"
                                                name="open_time"
                                                value={formData.open_time}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#52443F]">
                                                Jam Tutup
                                            </label>
                                            <input
                                                type="time"
                                                name="close_time"
                                                value={formData.close_time}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[#52443F]">
                                                Durasi Meja (Menit)
                                            </label>
                                            <input
                                                type="number"
                                                name="time_interval"
                                                value={formData.time_interval}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-[#D6C2BC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#50281A] transition"
                                                placeholder="Contoh: 60"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggle Switch Status Elegan */}
                                    <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-[#D6C2BC] bg-white">
                                        <div>
                                            <h4 className="font-bold text-[#1E1B18]">
                                                Status Restoran
                                            </h4>
                                            <p className="text-sm text-[#84746E]">
                                                Tentukan apakah restoran sedang
                                                menerima pelanggan saat ini.
                                            </p>
                                        </div>
                                        <div className="mt-4 md:mt-0 flex bg-[#F5F1E9] p-1 rounded-lg border border-[#D6C2BC]/50">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        status: "open",
                                                    })
                                                }
                                                className={`px-6 py-2 text-sm font-bold rounded-md transition ${formData.status === "open" ? "bg-[#1E524C] text-white shadow-sm" : "text-[#78716C] hover:text-[#1E1B18]"}`}
                                            >
                                                Buka
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        status: "closed",
                                                    })
                                                }
                                                className={`px-6 py-2 text-sm font-bold rounded-md transition ${formData.status === "closed" ? "bg-[#93000A] text-white shadow-sm" : "text-[#78716C] hover:text-[#1E1B18]"}`}
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 4: GALERI & FOTO */}
                            {activeTab === "galeri" && (
                                <>
                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18] mb-6 border-b border-[#D6C2BC]/40 pb-4">
                                        Manajemen Galeri & Foto
                                    </h3>

                                    {/* A. FOTO UTAMA / SAMPUL */}
                                    <div className="space-y-3 mb-8 p-5 rounded-xl border border-[#D6C2BC] bg-white">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#1E1B18]">
                                                Foto Utama / Sampul Restoran
                                            </h4>
                                            <p className="text-xs text-[#84746E] mt-1">
                                                Foto ini akan menjadi wajah
                                                utama restoran Anda di halaman
                                                pencarian.
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setCoverFile(
                                                    e.target.files?.[0] || null,
                                                )
                                            }
                                            className="w-full text-sm text-[#52443F] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5ECE7] file:text-[#50281A] hover:file:bg-[#EAE0DA] cursor-pointer"
                                        />
                                        {coverFile && (
                                            <p className="text-xs font-semibold text-[#1E524C]">
                                                Terpilih: {coverFile.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* B. GALERI TAMBAHAN (MULTI-UPLOAD) */}
                                    <div className="space-y-3 p-5 rounded-xl border border-[#D6C2BC] bg-white">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#1E1B18]">
                                                Foto Galeri (Bisa Pilih Banyak)
                                            </h4>
                                            <p className="text-xs text-[#84746E] mt-1">
                                                Tambahkan foto suasana, menu
                                                andalan, atau fasilitas
                                                restoran. Anda bisa menyorot
                                                (block) beberapa foto sekaligus
                                                saat memilih.
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    // Mengubah FileList menjadi Array agar mudah diproses
                                                    setGalleryFiles(
                                                        Array.from(
                                                            e.target.files,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="w-full text-sm text-[#52443F] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5ECE7] file:text-[#50281A] hover:file:bg-[#EAE0DA] cursor-pointer"
                                        />

                                        {galleryFiles.length > 0 && (
                                            <p className="text-xs font-semibold text-[#1E524C]">
                                                Terpilih: {galleryFiles.length}{" "}
                                                foto untuk diunggah.
                                            </p>
                                        )}

                                        {/* SUNTIKAN GRID FOTO LAMA */}
                                        {existingGalleries.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[#D6C2BC]/40">
                                                <h5 className="text-xs font-bold text-[#52443F] mb-3">
                                                    Foto Tersimpan:
                                                </h5>
                                                <div className="flex flex-wrap gap-4">
                                                    {existingGalleries.map(
                                                        (img) => (
                                                            <div
                                                                key={img.id}
                                                                className="relative group h-24 w-24 rounded-lg overflow-hidden border border-[#D6C2BC] bg-[#F5ECE7]"
                                                            >
                                                                {/* Tampilkan gambar dari storage Laravel */}
                                                                <img
                                                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${img.image_url}`}
                                                                    alt="Galeri"
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                {/* Tombol Hapus (Muncul saat di-hover) */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDeleteModal(
                                                                            {
                                                                                show: true,
                                                                                id: img.id,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2
                                                                        className="text-red-400 hover:text-red-500"
                                                                        size={
                                                                            24
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* MODAL KONFIRMASI HAPUS CUSTOM */}
                    <AnimatePresence>
                        {deleteModal.show && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-sm rounded-2xl bg-[#FDFCFB] p-6 shadow-2xl mx-4 border border-[#E5E1D9]"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
                                            <Trash2 size={28} />
                                        </div>
                                        <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                            Hapus Foto?
                                        </h3>
                                        <p className="mb-6 text-sm text-[#78716C]">
                                            Foto ini akan dihapus secara
                                            permanen dari galeri restoran.
                                            Tindakan ini tidak dapat dibatalkan.
                                        </p>
                                        <div className="flex w-full gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteModal({
                                                        show: false,
                                                        id: null,
                                                    })
                                                }
                                                className="flex-1 rounded-xl border border-[#D6C2BC] bg-white py-2.5 text-sm font-bold text-[#52443F] transition hover:bg-[#F5F1E9]"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (deleteModal.id)
                                                        handleDeleteGallery(
                                                            deleteModal.id,
                                                        );
                                                }}
                                                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700"
                                            >
                                                Ya, Hapus
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* TOMBOL SIMPAN GLOBAL */}
                    <div className="mt-8 pt-6 border-t border-[#D6C2BC]/40 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-xl bg-[#50281A] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#331105] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
