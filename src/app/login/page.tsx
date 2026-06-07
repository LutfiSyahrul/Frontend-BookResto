"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"masuk" | "daftar">("masuk");
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // State baru untuk menangani Form & API Backend
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Cek session lokal sebelum merender form login 
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        // Jika token dan data user ada di browser, langsung jebloskan ke halamannya masing-masing
        if (token && userStr) {
            try {
                const userData = JSON.parse(userStr);
                const userRole = userData.role;

                if (userRole === "adminresto") {
                    router.push("/adminresto/dashboard");
                } else if (userRole === "superadmin") {
                    router.push("/superadmin/dashboard");
                } else {
                    router.push("/beranda");
                }
                return; // Stop kodingan di sini, jangan tampilkan form login (mencegah kedipan UI)
            } catch (e) {
                // Jika data di localStorage korup/rusak, bersihkan sekalian
                localStorage.clear();
            }
        }

        // Jika tidak ada session aktif, baru munculkan form login dengan efek fade-in
        setIsVisible(true);
    }, [router]);

    // Fungsi utama untuk nembak API Login Laravel
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(""); // Reset error

        // Saat ini kita fokus ke fitur 'masuk' (Login) dulu
        if (activeTab === "masuk") {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/login`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email, password }),
                    },
                );

                const data = await response.json();

                if (response.ok && data.success) {
                    // 1. Simpan Token & Data User ke localStorage
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("user", JSON.stringify(data.data));

                    // 2. BACA (ROLE) DAN ARAHKAN KE PINTU YANG BENAR
                    const userRole = data.data.role;

                    if (userRole === "adminresto") {
                        router.push("/adminresto/dashboard"); // Masuk pintu Dapur (Admin)
                    } else if (userRole === "superadmin") {
                        router.push("/superadmin/dashboard"); // Masuk pintu VIP (Bos Besar)
                    } else {
                        router.push("/beranda"); // Masuk pintu depan (Customer)
                    }
                } else {
                    // Tampilkan pesan error dari backend (misal: "Email salah")
                    setErrorMessage(
                        data.message || "Gagal login. Silakan periksa kembali.",
                    );
                }
            } catch (error) {
                setErrorMessage(
                    "Tidak dapat terhubung ke server Laravel. Pastikan backend menyala.",
                );
            } finally {
                setIsLoading(false);
            }
        } else {
            // FITUR DAFTAR
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/register`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            name: name,
                            email: email,
                            phone: phone,
                            password: password,
                            password_confirmation: passwordConfirmation, // Otomatis dicocokkan Laravel
                        }),
                    },
                );

                const data = await response.json();

                if (response.ok && data.success) {
                    // Jika sukses daftar, langsung Auto-Login dan arahkan ke beranda
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("user", JSON.stringify(data.data));
                    router.push("/beranda");
                } else {
                    setErrorMessage(
                        data.message ||
                            "Gagal mendaftar. Email mungkin sudah dipakai.",
                    );
                }
            } catch (error) {
                setErrorMessage("Tidak dapat terhubung ke server Laravel.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <main
            className={`flex min-h-screen items-center justify-center bg-gradient-to-t from-[#FFF8F5] to-white p-4 sm:p-6 transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            <div className="flex w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white shadow-[0px_8px_30px_rgba(107,62,46,0.08)] outline outline-1 -outline-offset-1 outline-[rgba(214,194,188,0.30)] md:h-[90vh] md:max-h-[700px] md:flex-row">
                {/* Kolom Kiri: Gambar Background */}
                <div className="relative hidden w-full flex-1 flex-col justify-end bg-gray-100 md:flex">
                    <div className="absolute inset-0 h-full w-full">
                        <Image
                            src="/bg-login.png"
                            alt="Restaurant Ambiance"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(80,40,26,0.80)] to-transparent" />
                    <div className="relative z-10 flex flex-col items-start gap-3 p-8 lg:p-12 lg:pb-16">
                        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight text-white lg:text-[48px] lg:leading-[56px]">
                            Booking Resto
                        </h2>
                        <p className="max-w-[448px] font-['Inter'] text-sm leading-relaxed text-white opacity-90 lg:text-lg lg:leading-7">
                            Pengalaman bersantap eksklusif, dimulai dari
                            reservasi pertama Anda.
                        </p>
                    </div>
                </div>

                {/* Kolom Kanan: Form Auth */}
                <div className="flex w-full flex-1 flex-col justify-center overflow-y-auto bg-white p-6 sm:p-8 md:p-10 lg:p-16">
                    <div className="mb-6 lg:mb-10 flex w-full flex-col items-start">
                        <div className="flex w-full border-b border-[#D6C2BC]">
                            <button
                                onClick={() => {
                                    setActiveTab("masuk");
                                    setErrorMessage("");
                                }}
                                className={`flex flex-1 flex-col items-center justify-center py-3 lg:py-4 transition-colors ${activeTab === "masuk" ? "border-b-2 border-[#6B3E2E] text-[#6B3E2E]" : "text-[#52443F] hover:text-[#6B3E2E]"}`}
                            >
                                <span className="font-['Inter'] text-sm font-semibold tracking-[0.70px]">
                                    Masuk
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("daftar");
                                    setErrorMessage("");
                                }}
                                className={`flex flex-1 flex-col items-center justify-center py-3 lg:py-4 transition-colors ${activeTab === "daftar" ? "border-b-2 border-[#6B3E2E] text-[#6B3E2E]" : "text-[#52443F] hover:text-[#6B3E2E]"}`}
                            >
                                <span className="font-['Inter'] text-sm font-semibold tracking-[0.70px]">
                                    Daftar
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-col items-start gap-1 lg:mb-8">
                        <h1 className="font-['Plus_Jakarta_Sans'] text-xl lg:text-2xl font-semibold leading-8 text-[#1E1B18]">
                            {activeTab === "masuk"
                                ? "Selamat Datang Kembali"
                                : "Buat Akun Baru"}
                        </h1>
                        <p className="font-['Inter'] text-sm lg:text-base leading-6 text-[#52443F]">
                            {activeTab === "masuk"
                                ? "Silakan masuk ke akun Anda untuk melanjutkan."
                                : "Daftarkan diri Anda untuk pengalaman bersantap yang lebih baik."}
                        </p>
                    </div>

                    {/* Notifikasi Error jika login gagal */}
                    {errorMessage && (
                        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 outline outline-1 outline-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {/* Ganti event onSubmit ke handleAuth */}
                    <form
                        className="mb-4 flex flex-col gap-4 lg:gap-6"
                        onSubmit={handleAuth}
                    >
                        {/*  INPUT NAMA & WA (HANYA MUNCUL SAAT DAFTAR)  */}
                        {activeTab === "daftar" && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#1E1B18]">
                                        Nama Lengkap
                                    </label>
                                    <div className="flex h-10 items-center rounded-lg bg-[#E6E2DA] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] focus-within:outline-[#6B3E2E]">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            required
                                            placeholder="Misal: Ahmad Saboli"
                                            className="w-full bg-transparent font-['Inter'] text-sm lg:text-base text-[#1E1B18] placeholder-[#6B7280] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#1E1B18]">
                                        Nomor WhatsApp
                                    </label>
                                    <div className="flex h-10 items-center rounded-lg bg-[#E6E2DA] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] focus-within:outline-[#6B3E2E]">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(e.target.value)
                                            }
                                            required
                                            placeholder="Misal: 08123456789"
                                            className="w-full bg-transparent font-['Inter'] text-sm lg:text-base text-[#1E1B18] placeholder-[#6B7280] outline-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* INPUT EMAIL (Bawaan Asli) */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="email"
                                className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#1E1B18]"
                            >
                                Email
                            </label>
                            <div className="flex h-10 items-center rounded-lg bg-[#E6E2DA] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] focus-within:outline-[#6B3E2E]">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="nama@gmail.com"
                                    className="w-full bg-transparent font-['Inter'] text-sm lg:text-base text-[#1E1B18] placeholder-[#6B7280] outline-none"
                                />
                            </div>
                        </div>

                        {/* INPUT PASSWORD DENGAN ICON MATA */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#1E1B18]"
                                >
                                    Password
                                </label>
                                {activeTab === "masuk" && (
                                    <button
                                        type="button"
                                        className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#6B3E2E] hover:underline"
                                    >
                                        Lupa Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative flex h-10 items-center rounded-lg bg-[#E6E2DA] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] focus-within:outline-[#6B3E2E]">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-transparent font-['Inter'] text-sm lg:text-base text-[#1E1B18] placeholder-[#6B7280] outline-none pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#52443F] hover:text-[#6B3E2E] transition-colors"
                                >
                                    {/* Icon Mata Dinamis */}
                                    {showPassword ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 👇 TAMBAHAN KONFIRMASI PASSWORD (HANYA MUNCUL SAAT DAFTAR) 👇 */}
                        {activeTab === "daftar" && (
                            <div className="flex flex-col gap-2">
                                <label className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-[#1E1B18]">
                                    Konfirmasi Password
                                </label>
                                <div className="relative flex h-10 items-center rounded-lg bg-[#E6E2DA] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] focus-within:outline-[#6B3E2E]">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={passwordConfirmation}
                                        onChange={(e) =>
                                            setPasswordConfirmation(
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-transparent font-['Inter'] text-sm lg:text-base text-[#1E1B18] placeholder-[#6B7280] outline-none pr-10"
                                    />
                                    {/* Icon mata di konfirmasi password numpang state showPassword yang sama */}
                                </div>
                            </div>
                        )}

                        {/* TOMBOL SUBMIT */}
                        <div className="pt-2 lg:pt-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-10 lg:h-12 w-full items-center justify-center rounded-lg bg-[#6B3E2E] shadow-[0px_4px_12px_rgba(107,62,46,0.15)] transition-colors hover:bg-[#5a3426] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className="font-['Inter'] text-xs lg:text-sm font-semibold tracking-[0.70px] text-white">
                                    {isLoading
                                        ? "Memproses..."
                                        : activeTab === "masuk"
                                          ? "Masuk"
                                          : "Daftar Sekarang"}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* ... (Pemutus Atau Login Dengan Google dll ) ... */}
                </div>
            </div>
        </main>
    );
}
