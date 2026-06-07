"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface MenuAPI {
    id: number;
    kategori: string;
    nama_menu: string;
    harga: number;
    gambar_url: string;
}

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export default function MenuRestoranPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const restoranId = resolvedParams.id;
    const router = useRouter();
    const searchParams = useSearchParams();

    const reserveDate = searchParams.get("date");
    const reserveTime = searchParams.get("time");
    const reserveGuests = searchParams.get("guests");

    const [isVisible, setIsVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [isTransitioning, setIsTransitioning] = useState(false);

    // STATE UNTUK API
    const [menuData, setMenuData] = useState<MenuAPI[]>([]);
    const [restoName, setRestoName] = useState("Memuat...");
    const [categories, setCategories] = useState<string[]>(["Semua"]);
    const [isLoading, setIsLoading] = useState(true);

    // STATE KERANJANG & MODAL
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Tambahkan fungsi ini di dalam komponen sebelum return
    const formatDisplayDate = (dateString: string | null) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // FETCH DATA DARI LARAVEL
    useEffect(() => {
        setIsVisible(true);

        const fetchRestoData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restoranId}`
                );
                const result = await response.json();

                if (result.success) {
                    setRestoName(result.data.name);
                    const fetchedMenus = result.data.menus;
                    setMenuData(fetchedMenus);

                    // Ekstrak kategori unik dari data menu secara otomatis
                    const uniqueCategories = Array.from(
                        new Set(fetchedMenus.map((m: MenuAPI) => m.kategori)),
                    ) as string[];
                    setCategories(["Semua", ...uniqueCategories]);
                }
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestoData();
    }, [restoranId]);

    const handleCategoryChange = (category: string) => {
        if (category === activeCategory) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveCategory(category);
            setIsTransitioning(false);
        }, 250);
    };

    const updateQuantity = (item: MenuAPI, change: number) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.id === item.id);
            if (existing) {
                const qty = existing.quantity + change;
                return qty <= 0
                    ? prev.filter((c) => c.id !== item.id)
                    : prev.map((c) =>
                          c.id === item.id ? { ...c, quantity: qty } : c,
                      );
            }
            return change > 0
                ? [
                      ...prev,
                      {
                          id: item.id,
                          name: item.nama_menu,
                          price: item.harga, // Menggunakan harga dari DB
                          quantity: 1,
                      },
                  ]
                : prev;
        });
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );

    const handleLanjutBooking = () => {
        localStorage.setItem("pesananMenu", JSON.stringify(cart));
        // Arahkan ke Pilih Meja
        router.push(
            `/restoran/${restoranId}/pilih-meja?date=${reserveDate}&time=${reserveTime}&guests=${reserveGuests}`,
        );
    };
    // FUNGSI PENDETEKSI URL GAMBAR CERDAS
    const getImageUrl = (path: string | null) => {
        if (!path)
            return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600";

        // 1. Jika sudah berupa link web utuh dari luar
        if (path.startsWith("http")) return path;

        // 2. Jika path sudah mengandung awalan "/storage/" (Hasil upload Admin)
        if (path.startsWith("/storage/")) {
            return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
        }

        // 3. Jika path dari data lama (misal: "/menu/paket-ayam-kremes.jpg")
        // return path-nya apa adanya agar Next.js membacanya dari folder public lokal
        return path;
    };

    return (
        <div
            className={`relative flex min-h-screen flex-col w-full bg-[#FCFAF8] font-['Inter'] transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            {/* STICKY HEADER & SUB-HEADER JADWAL */}
            <div className="sticky top-0 z-[60] w-full bg-[#FCFAF8]/95 backdrop-blur-md shadow-sm">
                <nav className="flex h-[72px] items-center justify-center px-6 lg:px-10 border-b border-[#D6C2BC]/20">
                    <div className="flex w-full max-w-[1200px] items-center justify-between">
                        <button
                            onClick={() =>
                                router.push(`/restoran/${restoranId}`)
                            }
                            className="flex items-center gap-2 text-[#52443F] hover:text-[#50281A] transition"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            <span className="text-sm font-semibold">
                                Kembali
                            </span>
                        </button>
                        <h1 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                            Pilih Menu
                        </h1>
                        <div className="w-20"></div>
                    </div>
                </nav>

                {reserveDate && (
                    <div className="flex h-12 w-full items-center justify-center bg-[#F5ECE7]/60 px-6">
                        <div className="flex w-full max-w-[1200px] items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-wider text-[#50281A]">
                            <div className="flex items-center gap-2">
                                <span>{formatDisplayDate(reserveDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{reserveDate}</span>
                            </div>
                            <div className="h-3 w-px bg-[#D6C2BC]"></div>
                            <div className="flex items-center gap-2">
                                <span>{reserveTime} WIB</span>
                            </div>
                            <div className="h-3 w-px bg-[#D6C2BC]"></div>
                            <div className="flex items-center gap-2">
                                <span>{reserveGuests} Orang</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <main className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-6 py-12 pb-32 flex-1">
                <div className="text-center">
                    <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#50281A]">
                        {restoName}
                    </h2>
                </div>

                {isLoading ? (
                    <div className="text-center text-[#50281A] animate-pulse">
                        Memuat menu...
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap justify-center gap-3">
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => handleCategoryChange(c)}
                                    className={`rounded-full px-6 py-2 text-sm font-semibold transition ${activeCategory === c ? "bg-[#50281A] text-white shadow-md" : "bg-[#E6E2DA]/50 text-[#52443F] hover:bg-[#D6C2BC]/50"}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div
                            className={`w-full transition-opacity duration-300 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"}`}
                        >
                            {categories
                                .filter(
                                    (c) =>
                                        c !== "Semua" &&
                                        (activeCategory === "Semua" ||
                                            activeCategory === c),
                                )
                                .map((category) => {
                                    const itemsInCategory = menuData.filter(
                                        (item) => item.kategori === category,
                                    );

                                    if (itemsInCategory.length === 0)
                                        return null;

                                    return (
                                        <div
                                            key={category}
                                            className="mb-12 flex w-full flex-col gap-6"
                                        >
                                            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A] border-b border-[#D6C2BC]/50 pb-2">
                                                {category}
                                            </h3>

                                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                                {itemsInCategory.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="group flex flex-col overflow-hidden rounded-2xl bg-[#FDFCFB] shadow-[0px_4px_20px_-4px_rgba(107,62,46,0.05)] outline outline-1 -outline-offset-1 outline-[#D6C2BC]/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#50281A]/10"
                                                    >
                                                        <div className="relative h-[220px] w-full overflow-hidden bg-gray-100">
                                                            {/* Menggunakan URL gambar dari DB, fallback jika null */}
                                                            <img
                                                                src={getImageUrl(
                                                                    item.gambar_url,
                                                                )}
                                                                alt={
                                                                    item.nama_menu
                                                                }
                                                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                            />
                                                        </div>

                                                        <div className="flex flex-1 flex-col justify-between p-6">
                                                            <div className="flex flex-col gap-3">
                                                                <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18] line-clamp-2">
                                                                    {
                                                                        item.nama_menu
                                                                    }
                                                                </h4>
                                                            </div>

                                                            <div className="mt-6 flex items-center justify-between">
                                                                <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#50281A]">
                                                                    Rp{" "}
                                                                    {item.harga.toLocaleString(
                                                                        "id-ID",
                                                                    )}
                                                                </span>

                                                                <div className="flex items-center gap-3">
                                                                    {cart.find(
                                                                        (c) =>
                                                                            c.id ===
                                                                            item.id,
                                                                    ) ? (
                                                                        <div className="flex h-9 items-center gap-3 rounded-lg border border-[#50281A] bg-white px-2">
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateQuantity(
                                                                                        item,
                                                                                        -1,
                                                                                    )
                                                                                }
                                                                                className="flex h-6 w-6 items-center justify-center rounded text-[#50281A] hover:bg-[#F5ECE7] font-bold"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="w-4 text-center text-sm font-bold text-[#1E1B18]">
                                                                                {
                                                                                    cart.find(
                                                                                        (
                                                                                            c,
                                                                                        ) =>
                                                                                            c.id ===
                                                                                            item.id,
                                                                                    )
                                                                                        ?.quantity
                                                                                }
                                                                            </span>
                                                                            <button
                                                                                onClick={() =>
                                                                                    updateQuantity(
                                                                                        item,
                                                                                        1,
                                                                                    )
                                                                                }
                                                                                className="flex h-6 w-6 items-center justify-center rounded bg-[#50281A] text-white hover:bg-[#3d1e14] font-bold"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() =>
                                                                                updateQuantity(
                                                                                    item,
                                                                                    1,
                                                                                )
                                                                            }
                                                                            className="h-9 rounded-lg bg-[#F5ECE7] px-4 text-sm font-semibold text-[#50281A] transition hover:bg-[#50281A] hover:text-white"
                                                                        >
                                                                            Tambah
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
                )}
            </main>

            {/* SISA KODINGAN FOOTER & MODAL CART SAMA PERSIS SEPERTI SEBELUMNYA */}
            {totalItems > 0 && (
                <>
                    {/* 1. OVERLAY GELAP SAAT MODAL DIBUKA */}
                    <div
                        className={`fixed inset-0 z-[70] bg-[#1E1B18]/40 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                        onClick={() => setIsCartOpen(false)}
                    ></div>

                    {/* 2. MODAL DETAIL PESANAN (MUNCUL DARI BAWAH) */}
                    <div
                        className={`fixed bottom-0 left-0 right-0 md:left-1/2 z-[80] w-full md:max-w-[600px] md:-translate-x-1/2 rounded-t-[32px] bg-white p-6 md:p-8 shadow-2xl transition-transform duration-500 ${isCartOpen ? "translate-y-0" : "translate-y-full"}`}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="font-['Plus_Jakarta_Sans'] text-lg md:text-xl font-bold text-[#1E1B18]">
                                Detail Pesanan
                            </h3>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="rounded-full bg-[#F5ECE7] p-2 text-[#50281A] hover:bg-[#D6C2BC]/40 transition"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="mb-4 flex items-center justify-between border-b border-[#D6C2BC]/20 pb-4"
                                >
                                    <div className="flex-1 pr-2">
                                        <p className="font-bold text-[#1E1B18] text-sm md:text-base leading-tight mb-1">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-[#78716C]">
                                            Rp{" "}
                                            {item.price.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 md:gap-3 rounded-lg border border-[#D6C2BC] px-2 py-1">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item as any,
                                                        -1,
                                                    )
                                                }
                                                className="text-[#50281A] font-bold px-1"
                                            >
                                                -
                                            </button>
                                            <span className="text-xs md:text-sm font-bold w-3 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item as any,
                                                        1,
                                                    )
                                                }
                                                className="text-[#50281A] font-bold px-1"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 md:mt-6 flex items-center justify-between border-t border-[#D6C2BC] pt-4 md:pt-6">
                            <span className="text-base md:text-lg font-bold text-[#1E1B18]">
                                Total Pembayaran
                            </span>
                            <span className="text-lg md:text-xl font-black text-[#50281A]">
                                Rp {totalPrice.toLocaleString("id-ID")}
                            </span>
                        </div>
                        <button
                            onClick={handleLanjutBooking}
                            className="mt-6 md:mt-8 h-12 md:h-14 w-full rounded-2xl bg-[#50281A] text-sm md:text-base font-bold text-white shadow-lg transition hover:bg-[#3d1e14]"
                        >
                            Konfirmasi & Pilih Meja
                        </button>
                    </div>

                    {/* 3. FLOATING BAR RESPONSIVE BAWAH (VERSI BADAK ANTI HILANG) */}
                    <div
                        className={`fixed left-4 right-4 bottom-6 md:left-1/2 md:right-auto md:w-[calc(100%-48px)] md:max-w-[1000px] md:-translate-x-1/2 z-[999] rounded-2xl bg-[#50281A] p-4 text-white shadow-2xl flex items-center justify-between transition-all duration-300 ${isCartOpen ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
                    >
                        <div
                            className="flex cursor-pointer items-center gap-3 md:gap-4 pl-1"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <div className="relative">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#50281A]">
                                    {totalItems}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase opacity-70">
                                    Lihat Detail
                                </span>
                                <span className="font-['Plus_Jakarta_Sans'] text-base md:text-lg font-bold">
                                    Rp {totalPrice.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLanjutBooking}
                            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 md:px-5 md:py-3 text-xs md:text-sm font-bold transition hover:bg-white/20"
                        >
                            Pilih Meja
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}