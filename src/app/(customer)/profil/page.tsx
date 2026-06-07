"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/user`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                setUser(response.data);
            } catch (error) {
                console.error("Gagal ambil data user", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Fungsi Upload Foto
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append("avatar", e.target.files[0]);

            try {
                const token = localStorage.getItem("token");
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/user/update-avatar`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            // Menghapus "Content-Type" di sini, biar Axios otomatis membuat boundary yang benar
                        },
                    },
                );
                window.location.reload(); // Refresh untuk update foto
            } catch (error) {
                alert("Gagal mengunggah foto");
            }
        }
    };

    if (loading)
        return (
            <div className="flex min-h-screen items-center justify-center text-[#6B3E2E]">
                Memuat profil Anda...
            </div>
        );

    return (
        <main className="min-h-screen bg-[#FFF8F5] px-6 py-10 md:px-20">
            {/* Tombol Back ke Beranda */}
            <button
                onClick={() => router.push("/beranda")}
                className="mb-8 flex items-center gap-2 text-sm font-bold text-[#6B3E2E] transition-opacity hover:opacity-70"
            >
                {/* Tanda panah dipertebal dengan strokeWidth={2.5} */}
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                </svg>
                Kembali ke Beranda
            </button>

            <div className="mx-auto max-w-2xl rounded-3xl border border-[#D6C2BC] bg-white p-8 shadow-sm">
                <h1 className="mb-8 font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1E1B18]">
                    Profil Saya
                </h1>

                {/* Bagian Foto Profil */}
                <div className="flex flex-col items-center gap-4 border-b border-[#E6E2DA] pb-8">
                    <div
                        className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-4 border-[#F5ECE7] shadow-lg transition hover:ring-4 hover:ring-[#6B3E2E]"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {user?.avatar_url ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${user.avatar_url}`}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#6B3E2E] text-white font-bold text-3xl">
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <p className="text-xs text-[#78716C]">
                        Klik foto untuk mengganti avatar
                    </p>
                </div>

                {/* Info Data Diri */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase text-[#78716C]">
                            Nama Lengkap
                        </label>
                        <div className="rounded-lg bg-[#FDFCFB] px-4 py-3 font-semibold text-[#1E1B18] border border-[#E6E2DA]">
                            {user?.name}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase text-[#78716C]">
                            Nomor WhatsApp
                        </label>
                        <div className="rounded-lg bg-[#FDFCFB] px-4 py-3 font-semibold text-[#1E1B18] border border-[#E6E2DA]">
                            {user?.phone}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase text-[#78716C]">
                            Alamat Email
                        </label>
                        <div className="rounded-lg bg-[#FDFCFB] px-4 py-3 font-semibold text-[#1E1B18] border border-[#E6E2DA]">
                            {user?.email}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
