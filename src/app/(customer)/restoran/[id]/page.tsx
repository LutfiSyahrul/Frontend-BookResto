"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Definisikan tipe data sesuai dengan response API Laravel
interface RestaurantData {
    id: number;
    name: string;
    category: string | null;
    price_range: string | null;
    rating: number;
    reviews_count: number;
    location: string;
    image_url: string | null;
    description: string | null;
    menus?: any[];
    tables?: any[];
    galleries?: any[];
    open_time?: string | null; 
    close_time?: string | null; 
    time_interval?: number | null; 
}

export default function DetailRestoranPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();

    // UNWRAP PARAMS MENGGUNAKAN React.use() KHUSUS NEXT.JS 15
    const resolvedParams = use(params);
    const restoranId = resolvedParams.id;

    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [activeArea, setActiveArea] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // State untuk Data Database
    const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);

    // State untuk Reservasi
    const [reserveDate, setReserveDate] = useState(new Date());
    const [reserveTime, setReserveTime] = useState("19:00");
    const [reserveGuests, setReserveGuests] = useState(2);
    const [activeDropdown, setActiveDropdown] = useState("");

    // STATE UNTUK FAVORIT
    const [isFavorited, setIsFavorited] = useState(false);

    // FUNGSI TOGGLE FAVORIT (OPTIMISTIC UI)
    const handleToggleFavorite = async () => {
        // PENJAGA GAWANG: Kalau data resto belum ada, stop eksekusi biar TS bahagia
        if (!restaurantData) return;

        // Cek apakah user sudah login (cek token di localStorage)
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Login dulu yuk bosku buat simpan resto favoritmu!");
            return;
        }

        // Optimistic UI: Langsung ubah warna icon love jadi merah detik itu juga!
        const previousState = isFavorited;
        setIsFavorited(!isFavorited);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/favorites/${restaurantData.id}/toggle`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                },
            );
            const result = await response.json();

            // Kalau ternyata API gagal/error, kembalikan warna love seperti semula
            if (!result.success) {
                setIsFavorited(previousState);
                console.error("Gagal update favorit:", result.message);
            }
        } catch (error) {
            setIsFavorited(previousState);
            console.error("Error toggle favorit:", error);
        }
    };

    // Fungsi untuk mengubah simbol dolar dari DB menjadi teks harga yang cantik
    const formatPriceDisplay = (priceSymbol: string | null) => {
        if (priceSymbol === "$") return "Rp 10.000 - Rp 50.000";
        if (priceSymbol === "$$") return "Rp 50.000 - Rp 100.000";
        if (priceSymbol === "$$$") return "Rp 200.000 - Rp 500.000";
        return priceSymbol;
    };

    const availableDates = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    // FUNGSI SAKTI: Memecah jam operasional dan menyembunyikan jam yang sudah lewat
    const generatedTimeSlots = useMemo(() => {
        // Kalau data dari database belum ada, kasih nilai default
        if (
            !restaurantData ||
            !restaurantData.open_time ||
            !restaurantData.close_time
        ) {
            return [
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "18:00",
                "19:00",
                "20:00",
            ];
        }

        const slots = [];
        // Pecah jam misal "10:00:00" jadi angka 10 dan 0
        const [openHour, openMin] = restaurantData.open_time
            .split(":")
            .map(Number);
        const [closeHour, closeMin] = restaurantData.close_time
            .split(":")
            .map(Number);
        const interval = restaurantData.time_interval || 60; // Pakai interval database, kalau kosong default 60 mnt

        let currentHour = openHour;
        let currentMin = openMin;

        // Looping untuk membuat slot waktu sampai jam tutup
        while (
            currentHour < closeHour ||
            (currentHour === closeHour && currentMin <= closeMin)
        ) {
            const formattedHour = String(currentHour).padStart(2, "0");
            const formattedMin = String(currentMin).padStart(2, "0");
            slots.push(`${formattedHour}:${formattedMin}`);

            currentMin += interval;
            if (currentMin >= 60) {
                currentHour += Math.floor(currentMin / 60);
                currentMin = currentMin % 60;
            }
        }

        // Fitur Filter: Cek apakah hari yang dipilih adalah hari ini
        const now = new Date();
        const isToday = reserveDate.toDateString() === now.toDateString();

        // Buang slot jam yang sudah lewat di hari ini
        const validSlots = slots.filter((time) => {
            if (!isToday) return true; // Kalau booking buat besok, tampilkan semua
            const [h, m] = time.split(":").map(Number);
            return (
                h > now.getHours() ||
                (h === now.getHours() && m > now.getMinutes())
            );
        });

        // Kalau hari ini sudah tutup/jam habis, tampilkan teks ini
        return validSlots.length > 0 ? validSlots : ["Tutup / Penuh"];
    }, [restaurantData, reserveDate]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // FUNGSI SAKTI: Menarik data berdasarkan ID dari URL
    useEffect(() => {
        setIsVisible(true);

        const fetchRestaurantDetail = async () => {
            try {
                // Menggunakan restoranId yang sudah aman
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restoranId}`,
                );
                const result = await response.json();

                if (result.success) {
                    setRestaurantData(result.data);
                }
            } catch (error) {
                console.error("Gagal menarik data detail dari API:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurantDetail();
    }, [restoranId]);

    // FUNGSI PENGECEK: Apakah restoran ini sudah difavoritkan oleh user?
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            const token = localStorage.getItem("token");
            // Jika tidak ada token atau data restoran belum kelar dimuat, batalkan
            if (!token || !restaurantData) return;

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    },
                );
                const result = await response.json();

                if (result.success) {
                    // Cek apakah ID restoran ini ada di dalam list favorit milik user
                    const sudahLike = result.data.some(
                        (resto: any) => resto.id === restaurantData.id,
                    );
                    setIsFavorited(sudahLike); // Kalau ada, otomatis langsung jadi MERAH
                }
            } catch (error) {
                console.error("Gagal mengecek status favorit:", error);
            }
        };

        checkFavoriteStatus();
    }, [restaurantData]);

    // Tampilan saat data masih ditarik (Loading)
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#FCFAF8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D6C2BC] border-t-[#50281A]"></div>
                    <p className="font-['Inter'] text-[#52443F]">
                        Sedang memuat detail restoran
                    </p>
                </div>
            </div>
        );
    }

    // Tampilan jika ID restoran tidak ada di database
    if (!restaurantData) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#FCFAF8]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#1E1B18]">
                        404
                    </h1>
                    <p className="font-['Inter'] text-[#52443F]">
                        Waduh, restoran yang anda cari tidak ditemukan.
                    </p>
                    <Link
                        href="/eksplorasi"
                        className="mt-4 rounded-lg bg-[#50281A] px-6 py-2 text-sm font-semibold text-white"
                    >
                        Kembali Eksplorasi
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative min-h-screen w-full bg-[#FCFAF8] font-['Inter'] transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            {activeDropdown !== "" && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveDropdown("")}
                ></div>
            )}

            {/* NAVBAR */}
            <nav className="flex h-[72px] items-center justify-center px-6 lg:px-10 border-b border-[#D6C2BC]/20 bg-[#FCFAF8]">
                <div className="flex w-full max-w-[1200px] items-center justify-between">
                    {/* KIRI: Tombol Panah Back + Tulisan Booking Resto */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/")} // Mengarah langsung ke halaman beranda
                            className="group flex h-9 w-9 items-center justify-center rounded-full bg-[#F5ECE7] text-[#52443F] hover:bg-[#50281A] hover:text-white transition-all shadow-sm"
                        >
                            <svg
                                className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        <h1 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                            Booking Resto
                        </h1>
                    </div>

                    {/* KANAN: Menu Navigasi */}
                    <div className="flex items-center gap-8 font-['Plus_Jakarta_Sans']">
                        {/* Link Aktif (Ada garis bawah warna cokelat) */}
                        <Link
                            href="/eksplorasi"
                            className="text-[15px] font-bold text-[#50281A] border-b-2 border-[#50281A] pb-1.5"
                        >
                            Eksplorasi
                        </Link>

                        {/* Link Tidak Aktif (Warna abu-abu kecokelatan) */}
                        <Link
                            href="/reservasi"
                            className="text-[15px] font-bold text-[#84746E] hover:text-[#50281A] transition-colors"
                        >
                            Reservasi Saya
                        </Link>

                        <Link
                            href="/favorit"
                            className="text-[15px] font-bold text-[#84746E] hover:text-[#50281A] transition-colors"
                        >
                            Favorit
                        </Link>

                        {/* Lonceng & Love sudah dibuang sesuai request */}
                    </div>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 py-8 lg:px-10">
                {/* HERO IMAGE */}
                <div className="relative h-[300px] w-full overflow-hidden rounded-2xl md:h-[450px]">
                    <img
                        src={
                            restaurantData.image_url
                                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${restaurantData.image_url}`
                                : "https://placehold.co/1200x450?text=Gambar+Restoran"
                        }
                        alt={restaurantData.name}
                        className="h-full w-full object-cover"
                    />

                    {/* TOMBOL FAVORIT (LOVE) MELAYANG */}
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-md transition-transform hover:scale-110 sm:right-6 sm:top-6"
                    >
                        <svg
                            className={`h-7 w-7 transition-colors duration-300 ${
                                isFavorited
                                    ? "fill-[#EF4444] text-[#EF4444]" // Warna Merah saat disukai
                                    : "fill-none text-[#52443F]" // Transparan saat belum disukai
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={isFavorited ? 0 : 2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                </div>

                {/* INFO HEADER - DATA DINAMIS */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="rounded-full bg-[#E6E2DA] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#52443F]">
                            {restaurantData.category || "UMUM"}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-[#16A34A]"></div>
                            <span className="text-sm font-medium text-[#16A34A]">
                                Buka Sekarang
                            </span>
                        </div>
                    </div>
                    <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18] md:text-4xl">
                        {restaurantData.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#52443F] md:gap-8">
                        <div className="flex items-center gap-1.5">
                            <svg
                                className="h-4 w-4 text-[#F59E0B]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-semibold text-[#1E1B18]">
                                {restaurantData.rating}
                            </span>
                            <span>({restaurantData.reviews_count} Ulasan)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span>
                                {restaurantData.location ||
                                    "Lokasi belum tersedia"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
                            <span>
                                {formatPriceDisplay(
                                    restaurantData.price_range,
                                ) || "Rp -"}{" "}
                                / orang
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                    {/* KOLOM KIRI (70%) */}
                    <div className="flex flex-1 flex-col gap-8">
                        {/* 1. TAB BAR KLASIK (MENU & DENAH) */}
                        <div className="flex items-center gap-8 border-b border-[#E7E5E4]">
                            {["Menu", "Denah Tempat Duduk"].map((tab) => (
                                <button
                                    key={tab}
                                    // FUNGSI TOGGLE: Jika diklik lagi, tab akan tertutup (kosong)
                                    onClick={() =>
                                        setActiveTab(
                                            activeTab === tab ? "" : tab,
                                        )
                                    }
                                    className={`pb-3 font-['Plus_Jakarta_Sans'] text-sm transition ${activeTab === tab ? "border-b-2 border-[#50281A] font-bold text-[#50281A]" : "font-medium text-[#78716C] hover:text-[#50281A]"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* 2. AREA DINAMIS (Muncul tepat di bawah Tab hanya saat diklik) */}
                        {activeTab === "Menu" && (
                            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#1E1B18]">
                                    Daftar Menu
                                </h2>
                                {restaurantData.menus &&
                                restaurantData.menus.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {restaurantData.menus.map(
                                            (menu: any) => (
                                                <div
                                                    key={menu.id}
                                                    className="flex gap-4 border border-[#D6C2BC] rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                        <img
                                                            src={
                                                                menu.gambar_url?.startsWith(
                                                                    "/storage/",
                                                                )
                                                                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${menu.gambar_url}`
                                                                    : menu.gambar_url?.startsWith(
                                                                            "http",
                                                                        )
                                                                      ? menu.gambar_url
                                                                      : "https://placehold.co/100x100?text=Menu"
                                                            }
                                                            alt={menu.nama_menu}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-center min-w-0 flex-1">
                                                        <h3 className="font-bold text-[#1E1B18] text-sm truncate">
                                                            {menu.nama_menu}
                                                        </h3>
                                                        <p className="text-[11px] text-[#52443F] mt-0.5 truncate">
                                                            {menu.deskripsi ||
                                                                "Menu favorit pilihan."}
                                                        </p>
                                                        <span className="font-semibold text-[#50281A] text-sm mt-1">
                                                            Rp{" "}
                                                            {Number(
                                                                menu.harga,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#52443F] italic">
                                        Menu restoran belum diunggah.
                                    </p>
                                )}
                            </section>
                        )}

                        {activeTab === "Denah Tempat Duduk" && (
                            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#1E1B18]">
                                    Preview Denah Meja
                                </h2>

                                {/* TAB FILTER AREA DINAMIS DARI DATABASE */}
                                {restaurantData.tables &&
                                    restaurantData.tables.length > 0 && (
                                        <div className="flex items-center gap-2 border-b border-[#D6C2BC] pb-3 overflow-x-auto scrollbar-hide z-40">
                                            {Array.from(
                                                new Set(
                                                    restaurantData.tables.map(
                                                        (t: any) =>
                                                            t.area ||
                                                            "Area Umum",
                                                    ),
                                                ),
                                            ).map((area: any, index) => {
                                                const isSelected =
                                                    activeArea === area ||
                                                    (activeArea === "" &&
                                                        index === 0);
                                                return (
                                                    <button
                                                        key={area}
                                                        onClick={() =>
                                                            setActiveArea(area)
                                                        }
                                                        className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition shadow-sm ${
                                                            isSelected
                                                                ? "bg-[#50281A] text-white"
                                                                : "bg-[#F5ECE7] text-[#52443F] hover:bg-[#EAE0DA]"
                                                        }`}
                                                    >
                                                        {area}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                {/* CANVAS DENAH BERALAS KOTAK-KOTAK (DIAMBIL DARI RUMUS ASLI) */}
                                {/* 1. SUNTIKAN BUNGKUSAN SCROLL UNTUK MOBILE */}
                                <div className="w-full overflow-auto rounded-xl border border-[#D6C2BC] shadow-sm">
                                    {/* 2. KANVAS ASLI KITA KUNCI UKURANNYA (min-w-[800px]) */}
                                    <div
                                        className="relative min-w-[800px] h-[650px] sm:h-[600px] lg:h-[700px] w-full overflow-hidden bg-[#FCFAF8]"
                                        style={{
                                            backgroundSize: "20px 20px",
                                            backgroundImage:
                                                "linear-gradient(to right, rgba(107,62,46,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,62,46,0.03) 1px, transparent 1px)",
                                        }}
                                    >
                                        {/* Arah Mata Angin (TETAP SAMA) */}
                                        <div className="absolute inset-0 pointer-events-none z-0">
                                            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-[#84746E]/40">
                                                UTARA
                                            </span>
                                            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-[#84746E]/40">
                                                SELATAN
                                            </span>
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold tracking-[0.2em] text-[#84746E]/40 origin-center">
                                                BARAT
                                            </span>
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold tracking-[0.2em] text-[#84746E]/40 origin-center">
                                                TIMUR
                                            </span>
                                        </div>

                                        {/* Watermark Preview */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 p-4">
                                            <svg
                                                className="h-10 w-10 text-[#84746E]/10 mb-2 shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            <span className="text-[11px] sm:text-sm font-bold tracking-[0.2em] text-[#84746E]/20 uppercase text-center">
                                                Mode Preview
                                                <br />
                                                <span className="text-[9px] sm:text-[10px] tracking-normal font-medium normal-case">
                                                    Lanjut Pilih Menu untuk
                                                    Reservasi
                                                </span>
                                            </span>
                                        </div>

                                        {/* Render Miniatur Meja Secara Presisi (Sesuai Rumus Asli) */}
                                        {restaurantData.tables &&
                                            restaurantData.tables
                                                .filter((t: any) => {
                                                    const defaultArea =
                                                        Array.from(
                                                            new Set(
                                                                restaurantData.tables?.map(
                                                                    (
                                                                        tbl: any,
                                                                    ) =>
                                                                        tbl.area ||
                                                                        "Area Umum",
                                                                ),
                                                            ),
                                                        )[0];
                                                    const currentTarget =
                                                        activeArea ||
                                                        defaultArea;
                                                    return (
                                                        (t.area ||
                                                            "Area Umum") ===
                                                        currentTarget
                                                    );
                                                })
                                                .map((table: any) => {
                                                    const isZone =
                                                        table.shape === "zone";
                                                    return (
                                                        <div
                                                            key={table.id}
                                                            className={`absolute flex flex-col items-center justify-center opacity-70 pointer-events-none font-['Plus_Jakarta_Sans'] ${isZone ? "bg-[#84746E]/5 border-[#84746E]/30 text-[#84746E]/40 border-4 border-dashed rounded-xl z-0" : "bg-[#F5ECE7] border-[#D6C2BC] text-[#50281A] border-2 z-10 shadow-sm"} ${!isZone && table.shape === "circle" ? "rounded-full" : "rounded-xl"}`}
                                                            style={{
                                                                left: `${table.pos_x}%`,
                                                                top: `${table.pos_y}%`,
                                                                width:
                                                                    table.width ||
                                                                    (isZone
                                                                        ? 200
                                                                        : 75),
                                                                height:
                                                                    table.height ||
                                                                    (isZone
                                                                        ? 150
                                                                        : 75),
                                                            }}
                                                        >
                                                            {isZone ? (
                                                                <span className="text-xl sm:text-2xl font-black tracking-widest uppercase opacity-60 text-center break-words px-4">
                                                                    {table.name}
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm sm:text-base font-bold tracking-tight text-center px-1 leading-tight">
                                                                        {
                                                                            table.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-[8px] sm:text-[10px] opacity-80 font-medium mt-1">
                                                                        {table.capacity ||
                                                                            2}{" "}
                                                                        Kursi
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 3. TENTANG RESTORAN (Selalu Terlihat) */}
                        <section className="flex flex-col gap-3">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#1E1B18]">
                                Tentang Restoran
                            </h2>
                            <p className="text-sm leading-relaxed text-[#52443F] md:text-base whitespace-pre-line">
                                {restaurantData.description ||
                                    "Belum ada deskripsi untuk restoran ini."}
                            </p>
                        </section>

                        {/* 4. GALERI (Dinamis dari Database) */}
                        <section className="flex flex-col gap-3">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#1E1B18]">
                                Galeri
                            </h2>

                            {/* Logika Pengecekan: Jika ada foto tampilkan grid, jika kosong tampilkan teks */}
                            {restaurantData.galleries &&
                            restaurantData.galleries.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                                    {restaurantData.galleries.map(
                                        (foto: any) => {
                                            // Pengecekan link gambar (apakah dari storage lokal atau link eksternal)
                                            const imageUrl =
                                                foto.image_url?.startsWith(
                                                    "http",
                                                )
                                                    ? foto.image_url
                                                    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${foto.image_url}`;

                                            return (
                                                <div
                                                    key={foto.id}
                                                    className="h-[120px] sm:h-[150px] md:h-[180px] w-full overflow-hidden rounded-xl border border-[#D6C2BC]/40 shadow-sm"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt="Galeri Restoran"
                                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110 cursor-pointer"
                                                    />
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-[150px] w-full items-center justify-center rounded-xl border border-dashed border-[#D6C2BC] bg-[#FCFAF8]">
                                    <p className="text-sm text-[#78716C] italic">
                                        Belum ada foto galeri.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* KOLOM KANAN - RESERVASI CARD (30%) */}
                    <aside className="w-full shrink-0 lg:w-[360px]">
                        {/* PERUBAHAN DI SINI COY: Tambahkan kondisi z-50 agar kotak reservasi ini naik ke atas layar transparan saat diklik */}
                        <div
                            className={`sticky top-[100px] flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0px_8px_30px_-4px_rgba(107,62,46,0.08)] outline outline-1 -outline-offset-1 outline-[rgba(214,194,188,0.30)] ${activeDropdown !== "" ? "z-50" : "z-10"}`}
                        >
                            <div className="flex flex-col gap-4">
                                {/* ---------------- INPUT TANGGAL ---------------- */}
                                <div
                                    className={`relative flex flex-col gap-1.5 ${activeDropdown === "date" ? "z-50" : "z-30"}`}
                                >
                                    <label className="text-xs font-medium text-[#52443F]">
                                        Tanggal
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveDropdown(
                                                activeDropdown === "date"
                                                    ? ""
                                                    : "date",
                                            )
                                        }
                                        className={`flex w-full h-12 cursor-pointer items-center gap-3 rounded-xl border ${activeDropdown === "date" ? "border-[#50281A] bg-white" : "border-transparent bg-[#F5ECE7] hover:bg-[#eadeD8]"} px-4 transition-colors`}
                                    >
                                        <svg
                                            className="h-5 w-5 shrink-0 text-[#50281A]"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="truncate text-sm font-semibold text-[#1E1B18]">
                                            {formatDate(reserveDate)}
                                        </span>
                                    </button>
                                    {/* POPOVER DATE */}
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute left-0 top-[70px] w-full origin-top transform rounded-xl border border-[#D6C2BC] bg-white p-4 shadow-xl transition-all duration-200 ${activeDropdown === "date" ? "pointer-events-auto visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0"}`}
                                    >
                                        <p className="mb-3 text-xs font-semibold text-[#78716C]">
                                            Pilih Tanggal (14 Hari ke Depan)
                                        </p>
                                        <div className="custom-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2">
                                            {availableDates.map((date, idx) => {
                                                const isSelected =
                                                    date.toDateString() ===
                                                    reserveDate.toDateString();
                                                const dayName =
                                                    date.toLocaleDateString(
                                                        "id-ID",
                                                        { weekday: "short" },
                                                    );
                                                const dateNum = date.getDate();
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setReserveDate(
                                                                date,
                                                            );
                                                            setActiveDropdown(
                                                                "",
                                                            );
                                                        }}
                                                        className={`flex min-w-[64px] shrink-0 snap-start cursor-pointer flex-col items-center rounded-xl border p-2 transition-all ${isSelected ? "border-[#50281A] bg-[#50281A] text-white shadow-md" : "border-[#D6C2BC]/50 bg-white text-[#52443F] hover:border-[#50281A]"}`}
                                                    >
                                                        <span className="text-[11px] font-medium uppercase">
                                                            {dayName}
                                                        </span>
                                                        <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold">
                                                            {dateNum}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ---------------- INPUT WAKTU ---------------- */}
                                <div
                                    className={`relative flex flex-col gap-1.5 ${activeDropdown === "time" ? "z-50" : "z-20"}`}
                                >
                                    <label className="text-xs font-medium text-[#52443F]">
                                        Waktu
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveDropdown(
                                                activeDropdown === "time"
                                                    ? ""
                                                    : "time",
                                            )
                                        }
                                        className={`flex w-full h-12 cursor-pointer items-center gap-3 rounded-xl border ${activeDropdown === "time" ? "border-[#50281A] bg-white" : "border-transparent bg-[#F5ECE7] hover:bg-[#eadeD8]"} px-4 transition-colors`}
                                    >
                                        <svg
                                            className="h-5 w-5 shrink-0 text-[#50281A]"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span className="text-sm font-semibold text-[#1E1B18]">
                                            {reserveTime} WIB
                                        </span>
                                    </button>
                                    {/* POPOVER TIME */}
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute left-0 top-[70px] w-full origin-top transform rounded-xl border border-[#D6C2BC] bg-white p-4 shadow-xl transition-all duration-200 ${activeDropdown === "time" ? "pointer-events-auto visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0"}`}
                                    >
                                        <p className="mb-3 text-xs font-semibold text-[#78716C]">
                                            Pilih Waktu Kedatangan
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {generatedTimeSlots.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    disabled={
                                                        time === "Tutup / Penuh"
                                                    } // Matikan klik kalau jam habis
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (
                                                            time !==
                                                            "Tutup / Penuh"
                                                        ) {
                                                            setReserveTime(
                                                                time,
                                                            );
                                                            setActiveDropdown(
                                                                "",
                                                            );
                                                        }
                                                    }}
                                                    className={`cursor-pointer rounded-lg border py-2 text-center text-sm font-semibold transition-all ${time === "Tutup / Penuh" ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : reserveTime === time ? "border-[#50281A] bg-[#50281A] text-white shadow-md" : "border-[#D6C2BC]/50 bg-white text-[#52443F] hover:border-[#50281A]"}`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ---------------- INPUT JUMLAH TAMU ---------------- */}
                                <div
                                    className={`relative flex flex-col gap-1.5 ${activeDropdown === "guests" ? "z-50" : "z-10"}`}
                                >
                                    <label className="text-xs font-medium text-[#52443F]">
                                        Jumlah Tamu
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveDropdown(
                                                activeDropdown === "guests"
                                                    ? ""
                                                    : "guests",
                                            )
                                        }
                                        className={`flex w-full h-12 cursor-pointer items-center justify-between rounded-xl border ${activeDropdown === "guests" ? "border-[#50281A] bg-white" : "border-transparent bg-[#F5ECE7] hover:bg-[#eadeD8]"} px-4 transition-colors`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg
                                                className="h-5 w-5 shrink-0 text-[#50281A]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            <span className="text-sm font-semibold text-[#1E1B18]">
                                                {reserveGuests} Orang
                                            </span>
                                        </div>
                                        <svg
                                            className={`h-4 w-4 text-[#52443F] transition-transform duration-200 ${activeDropdown === "guests" ? "rotate-180" : ""}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {/* POPOVER GUESTS */}
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute left-0 top-[70px] w-full origin-top transform rounded-xl border border-[#D6C2BC] bg-white p-4 shadow-xl transition-all duration-200 ${activeDropdown === "guests" ? "pointer-events-auto visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0"}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-[#1E1B18]">
                                                Jumlah Tamu
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setReserveGuests(
                                                            (prev) =>
                                                                Math.max(
                                                                    1,
                                                                    prev - 1,
                                                                ),
                                                        );
                                                    }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6C2BC] text-[#50281A] transition hover:bg-[#F5ECE7] disabled:opacity-30"
                                                    disabled={
                                                        reserveGuests <= 1
                                                    }
                                                >
                                                    -
                                                </button>
                                                <span className="w-4 text-center font-['Plus_Jakarta_Sans'] font-bold text-[#1E1B18]">
                                                    {reserveGuests}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setReserveGuests(
                                                            (prev) =>
                                                                Math.min(
                                                                    20,
                                                                    prev + 1,
                                                                ),
                                                        );
                                                    }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6C2BC] text-[#50281A] transition hover:bg-[#F5ECE7]"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setActiveDropdown("");
                                            }}
                                            className="mt-4 w-full rounded-lg bg-[#E6E2DA] py-2 text-xs font-semibold text-[#50281A] hover:bg-[#d8d3cb]"
                                        >
                                            Selesai
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 pt-2">
                                <Link
                                    href={`/restoran/${restoranId}/menu?date=${reserveDate.getFullYear()}-${String(reserveDate.getMonth() + 1).padStart(2, "0")}-${String(reserveDate.getDate()).padStart(2, "0")}&time=${reserveTime}&guests=${reserveGuests}`}
                                    className="flex h-11 w-full items-center justify-center rounded-lg bg-[#50281A] text-sm font-semibold text-white transition hover:bg-[#3d1e14] text-center"
                                >
                                    Lanjut Pilih Menu
                                </Link>
                                <span className="text-[11px] text-[#78716C]">
                                    Tidak ada biaya pemesanan di awal.
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d6c2bc;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
