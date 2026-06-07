"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Restaurant {
    id: number;
    name: string;
    category: string | null;
    price_range: string | null;
    rating: number;
    reviews_count: number;
    location: string;
    image_url: string | null;
    slug: string;
}

export default function EksplorasiPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedPrice, setSelectedPrice] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    const categories = [
        "Restorant",
        "Cafe & Coffee Shop",
        "Seafood",
        "Vegetarian",
    ];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            try {
                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/restaurants`,
                );
                url.searchParams.append("page", currentPage.toString());
                if (selectedCategory)
                    url.searchParams.append("category", selectedCategory);
                if (selectedPrice)
                    url.searchParams.append("price", selectedPrice);

                if (searchQuery) url.searchParams.append("search", searchQuery);

                const response = await fetch(url.toString());
                const result = await response.json();

                if (result.success) {
                    setRestaurants(result.data.data);
                    setTotalPages(result.data.last_page);
                }
            } catch (error) {
                console.error("Gagal menarik data dari API:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurants();
    }, [currentPage, selectedCategory, selectedPrice, searchQuery]);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory((prev) => (prev === cat ? "" : cat));
        setCurrentPage(1);
    };

    const handlePriceChange = (price: string) => {
        setSelectedPrice((prev) => (prev === price ? "" : price));
        setCurrentPage(1);
    };

    // Pisahkan restoran pertama untuk Sorotan (jika tidak ada filter)
    const isFiltering = selectedCategory !== "" || selectedPrice !== "";
    const highlightResto = restaurants.length > 0 ? restaurants[0] : null;
    const gridRestos = isFiltering ? restaurants : restaurants.slice(1);

    // Fungsi untuk mengubah simbol dolar dari DB menjadi teks harga yang cantik
    const formatPriceDisplay = (priceSymbol: string | null) => {
        if (priceSymbol === "$") return "Rp 10.000 - Rp 50.000";
        if (priceSymbol === "$$") return "Rp 50.000 - Rp 100.000";
        if (priceSymbol === "$$$") return "Rp 200.000 - Rp 500.000";
        return priceSymbol;
    };

    const router = useRouter();

    return (
        <div
            className={`relative min-h-screen w-full bg-gradient-to-b from-[#FFF8F5] to-white font-['Inter'] transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 flex h-[72px] w-full items-center justify-center border-b border-[#E7E5E4]/60 bg-[#FDFCFB]/90 px-6 backdrop-blur-md lg:px-10">
                <div className="flex w-full max-w-[1280px] items-center justify-between">
                    {/* Logo & Search Bar */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/beranda"
                            className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E] md:text-2xl hover:opacity-80 transition"
                        >
                            Booking Resto
                        </Link>
                        {/* Search Bar Berfungsi (Live Search) */}
                        <div className="hidden h-[42px] w-[320px] items-center rounded-xl bg-[#F5ECE7] px-4 outline outline-1 -outline-offset-1 outline-[#D6C2BC] md:flex focus-within:outline-[#6B3E2E]">
                            <svg
                                className="h-5 w-5 text-[#52443F]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari restoran..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1); // Otomatis balik ke halaman 1 saat ngetik
                                }}
                                className="ml-3 w-full bg-transparent text-sm text-[#52443F] placeholder-[#52443F]/60 outline-none font-['Inter']"
                            />
                        </div>
                    </div>

                    {/* Menu Links & Icons */}
                    <div className="hidden items-center gap-8 lg:flex">
                        <div className="flex items-center gap-6">
                            <div className="border-b-2 border-[#6B3E2E] pb-1">
                                <Link
                                    href="/eksplorasi"
                                    className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#6B3E2E]"
                                >
                                    Eksplorasi
                                </Link>
                            </div>
                            <div className="pb-1">
                                <Link
                                    href="/reservasi"
                                    className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] hover:text-[#6B3E2E] cursor-pointer transition"
                                >
                                    Reservasi Saya
                                </Link>
                            </div>
                            <div className="pb-1">
                                <Link
                                    href="/favorit"
                                    className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#78716C] hover:text-[#6B3E2E] cursor-pointer transition"
                                >
                                    Favorit
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-8 md:flex-row lg:px-10 lg:py-12">
                {/* SIDEBAR FILTER */}
                <aside className="flex w-full flex-col gap-6 md:w-[290px] shrink-0">
                    <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-[0px_4px_20px_-4px_rgba(107,62,46,0.04)] outline outline-1 -outline-offset-1 outline-[rgba(214,194,188,0.30)]">
                        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-[#1E1B18]">
                            Kategori
                        </h2>
                        <div className="flex flex-col gap-3">
                            {categories.map((cat) => (
                                <label
                                    key={cat}
                                    className="flex cursor-pointer items-center gap-3 group"
                                >
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${selectedCategory === cat ? "border-[#50281A] bg-[#50281A]" : "border-[#84746E] bg-white group-hover:border-[#50281A]"}`}
                                    >
                                        {selectedCategory === cat && (
                                            <svg
                                                className="h-3 w-3 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        className={`font-['Inter'] text-base transition-colors ${selectedCategory === cat ? "text-[#1E1B18] font-medium" : "text-[#52443F]"}`}
                                    >
                                        {cat}
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedCategory === cat}
                                        onChange={() =>
                                            handleCategoryChange(cat)
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-[0px_4px_20px_-4px_rgba(107,62,46,0.04)] outline outline-1 -outline-offset-1 outline-[rgba(214,194,188,0.30)]">
                        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-[#1E1B18]">
                            Harga
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: "< Rp 50rb", value: "$" },
                                { label: "Rp 50rb - 100rb", value: "$$" },
                                { label: "> Rp 200rb", value: "$$$" },
                            ].map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() =>
                                        handlePriceChange(item.value)
                                    }
                                    className={`flex h-8 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-wide transition-colors ${selectedPrice === item.value ? "bg-[#50281A] text-white" : "bg-[#E6E2DA] text-[#52443F] hover:bg-[#d6c2bc]"}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* KONTEN KANAN */}
                <div className="flex w-full flex-col gap-12">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <p className="text-[#52443F]">
                                Memuat data restoran...
                            </p>
                        </div>
                    ) : restaurants.length > 0 ? (
                        <>
                            {/* TAMPILKAN SOROTAN JIKA TIDAK ADA FILTER */}
                            {!isFiltering && highlightResto && (
                                <section className="flex flex-col gap-6">
                                    <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-semibold text-[#1E1B18]">
                                        Sorotan Hari Ini
                                    </h2>
                                    <div className="group relative h-[300px] md:h-[400px] w-full overflow-hidden rounded-xl shadow-[0px_8px_30px_-4px_rgba(107,62,46,0.12)]">
                                        <img
                                            src={
                                                highlightResto.image_url
                                                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${highlightResto.image_url}`
                                                    : "https://placehold.co/918x400"
                                            }
                                            alt={highlightResto.name}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-[#BA1A1A]/90 px-3 py-1 backdrop-blur-sm shadow-md">
                                            <svg
                                                className="h-3 w-3 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="font-['Inter'] text-xs font-semibold tracking-wide text-white">
                                                Popular
                                            </span>
                                        </div>

                                        <div className="absolute bottom-0 left-0 flex w-full flex-col items-start justify-between gap-4 p-4 md:flex-row md:items-end md:p-6 lg:p-8">
                                            <div className="flex flex-col gap-2">
                                                <h3 className="font-['Plus_Jakarta_Sans'] text-3xl md:text-5xl font-bold text-white shadow-black drop-shadow-lg">
                                                    {highlightResto.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            className="h-5 w-5 text-[#FBBF24]"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="font-['Inter'] text-sm md:text-base font-semibold text-white/90">
                                                            {
                                                                highlightResto.rating
                                                            }
                                                        </span>
                                                        <span className="font-['Inter'] text-sm md:text-base text-white/60">
                                                            (
                                                            {
                                                                highlightResto.reviews_count
                                                            }{" "}
                                                            Ulasan)
                                                        </span>
                                                    </div>
                                                    <span className="hidden text-white/60 md:block">
                                                        •
                                                    </span>
                                                    <span className="font-['Inter'] text-sm md:text-base text-white/90">
                                                        {
                                                            highlightResto.location
                                                        }
                                                    </span>
                                                    {highlightResto.category && (
                                                        <>
                                                            <span className="hidden text-white/60 md:block">
                                                                •
                                                            </span>
                                                            <span className="font-['Inter'] text-sm md:text-base text-white/90">
                                                                {
                                                                    highlightResto.category
                                                                }
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Ganti <button> menjadi <Link> dan arahkan ke ID-nya */}
                                            <Link
                                                href={`/restoran/${highlightResto.id}`}
                                                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#50281A] px-8 text-sm font-semibold tracking-wide text-white shadow-lg hover:bg-[#3d1e13] transition md:w-auto text-center"
                                            >
                                                Reservasi
                                            </Link>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* TAMPILAN GRID */}
                            {gridRestos.length > 0 && (
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-end justify-between">
                                        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-[#1E1B18]">
                                            {isFiltering
                                                ? `Hasil Pencarian`
                                                : "Rekomendasi Lainnya"}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {gridRestos.map((resto) => (
                                            <Link
                                                href={`/restoran/${resto.id}`}
                                                key={resto.id}
                                                className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0px_4px_20px_-4px_rgba(107,62,46,0.04)] outline outline-1 -outline-offset-1 outline-[rgba(214,194,188,0.30)] group cursor-pointer transition hover:shadow-lg hover:-translate-y-1"
                                            >
                                                <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
                                                    <img
                                                        src={
                                                            resto.image_url
                                                                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${resto.image_url}`
                                                                : "https://placehold.co/288x200?text=No+Image"
                                                        }
                                                        alt={resto.name}
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="flex flex-col p-5">
                                                    <div className="mb-2 flex items-start justify-between">
                                                        <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18] line-clamp-1">
                                                            {resto.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1 rounded-md bg-[#F5ECE7] px-2 py-1">
                                                            <svg
                                                                className="h-3 w-3 text-[#F59E0B]"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            <span className="font-['Inter'] text-xs font-bold text-[#1E1B18]">
                                                                {resto.rating}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="mb-4 font-['Inter'] text-sm text-[#52443F]">
                                                        {[
                                                            resto.category,
                                                            formatPriceDisplay(
                                                                resto.price_range,
                                                            ),
                                                            resto.location,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" • ")}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Pagination Dinamis */}
                                    {totalPages > 1 && (
                                        <div className="mt-8 flex w-full items-center justify-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.max(prev - 1, 1),
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6C2BC] text-[#52443F] transition hover:bg-[#E6E2DA] disabled:opacity-50"
                                            >
                                                &lt;
                                            </button>
                                            {[...Array(totalPages)].map(
                                                (_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                i + 1,
                                                            )
                                                        }
                                                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition ${currentPage === i + 1 ? "bg-[#50281A] text-white shadow-md" : "text-[#52443F] hover:bg-[#E6E2DA]"}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ),
                                            )}
                                            <button
                                                onClick={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.min(
                                                            prev + 1,
                                                            totalPages,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6C2BC] text-[#52443F] transition hover:bg-[#E6E2DA] disabled:opacity-50"
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D6C2BC] bg-[#FDFCFB] py-20 text-center">
                            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-[#1E1B18]">
                                Tidak Ditemukan
                            </h3>
                            <p className="font-['Inter'] text-[#52443F]">
                                Belum ada restoran yang sesuai dengan filter
                                bos.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
