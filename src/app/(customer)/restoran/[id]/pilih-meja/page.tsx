"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// FUNGSI UNTUK MENGUBAH FORMAT TANGGAL DI HEADER AGAR ESTETIK
const formatDisplayDate = (dateString: string | null) => {
    if (!dateString || dateString === "Belum dipilih")
        return "Tanggal Belum Dipilih";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch (e) {
        return dateString;
    }
};

function BookingContent({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resolvedParams = use(params);
    const restoranId = resolvedParams.id;

    const reserveDateRaw = searchParams.get("date") || "Belum dipilih";
    const reserveTime = searchParams.get("time") || "-";
    const reserveGuests = searchParams.get("guests") || "-";

    const [isVisible, setIsVisible] = useState(false);

    // STATE UNTUK DATA DINAMIS DARI LARAVEL
    const [tablesData, setTablesData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // STATE UNTUK TAB AREA (misal: Lantai 1, Lantai 2)
    const [activeArea, setActiveArea] = useState<string>("");
    const [areas, setAreas] = useState<string[]>([]);

    const [selectedTable, setSelectedTable] = useState<any>(null);

    // FETCH DATA DARI API
    useEffect(() => {
        const fetchRestoran = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restoranId}`
                );
                const resData = await response.json();

                if (resData.success && resData.data.tables) {
                    const dbTables = resData.data.tables;
                    setTablesData(dbTables);

                    // Mengekstrak area unik dari database
                    const uniqueAreas = Array.from(
                        new Set(dbTables.map((t: any) => t.area)),
                    ) as string[];
                    setAreas(uniqueAreas);

                    if (uniqueAreas.length > 0) {
                        setActiveArea(uniqueAreas[0]);
                    }

                    // Pilih meja pertama yang tersedia secara default
                    const defaultTable = dbTables.find(
                        (t: any) => t.status === "available",
                    );
                    if (defaultTable) setSelectedTable(defaultTable);
                }
            } catch (error) {
                console.error("Gagal menarik data meja:", error);
            } finally {
                setIsLoading(false);
                setIsVisible(true);
            }
        };

        fetchRestoran();
    }, [restoranId]);

    // Jika tab area berganti, kosongkan meja yang dipilih agar user tidak salah booking beda lantai
    useEffect(() => {
        if (selectedTable && selectedTable.area !== activeArea) {
            setSelectedTable(null);
        }
    }, [activeArea]);

    const handleLanjutRingkasan = () => {
        if (!selectedTable) return;
        localStorage.setItem("selectedTable", JSON.stringify(selectedTable));
        router.push(
            `/restoran/${restoranId}/konfirmasi?date=${reserveDateRaw}&time=${reserveTime}&guests=${reserveGuests}&tableId=${selectedTable.id}`,
        );
    };

    return (
        <div
            className={`relative min-h-screen w-full bg-[#FCFAF8] font-['Inter'] transition-opacity duration-700 pb-20 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            {/* HEADER STICKY */}
            <div className="sticky top-0 z-[60] w-full bg-[#FCFAF8]/95 backdrop-blur-md shadow-sm">
                <nav className="flex h-[72px] items-center justify-center px-6 lg:px-10 border-b border-[#D6C2BC]/20">
                    <div className="flex w-full max-w-[1200px] items-center justify-between">
                        <Link
                            href={`/restoran/${restoranId}/menu?date=${reserveDateRaw}&time=${reserveTime}&guests=${reserveGuests}`}
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
                                Kembali ke Menu
                            </span>
                        </Link>
                        <h1 className="absolute left-1/2 -translate-x-1/2 font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                            Pilih Meja
                        </h1>
                    </div>
                </nav>

                <div className="flex h-12 w-full items-center justify-center bg-[#F5ECE7]/60 px-6">
                    <div className="flex w-full max-w-[1200px] items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-wider text-[#50281A]">
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span>{formatDisplayDate(reserveDateRaw)}</span>
                        </div>
                        <div className="h-3 w-px bg-[#D6C2BC]"></div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{reserveTime} WIB</span>
                        </div>
                        <div className="h-3 w-px bg-[#D6C2BC]"></div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span>{reserveGuests} Orang</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto mt-10 flex w-full max-w-[1280px] flex-col gap-6 px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-10">
                {/* BAGIAN KIRI: DENAH MEJA DINAMIS */}
                <div className="relative flex min-h-[600px] w-full flex-col overflow-hidden rounded-2xl border border-[#D6C2BC] bg-[#FFF8F5] shadow-sm lg:h-[700px] lg:flex-1">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                            <Loader2
                                className="animate-spin text-[#6B3E2E]"
                                size={40}
                            />
                        </div>
                    )}
                    {/* TAB AREA / LANTAI */}
                    <div className="flex items-center gap-2 border-b border-gray-200 p-4 bg-white overflow-x-auto scrollbar-hide z-40">
                        {areas.map((area) => (
                            <button
                                key={area}
                                onClick={() => setActiveArea(area)}
                                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition shadow-sm ${activeArea === area ? "bg-[#50281A] text-white" : "text-[#52443F] bg-[#F5ECE7] hover:bg-[#EAE0DA]"}`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                    <div className="w-full overflow-auto flex-1 bg-[#FCFAF8]">
                        <div
                            className="relative min-w-[800px] h-[650px] w-full overflow-hidden p-6"
                            style={{
                                backgroundSize: "20px 20px",
                                backgroundImage:
                                    "linear-gradient(to right, rgba(107,62,46,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,62,46,0.03) 1px, transparent 1px)",
                            }}
                        >
                            {/* ARAH MATA ANGIN (WATERMARK) */}
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

                            {tablesData
                                .filter((t) => t.area === activeArea)
                                .map((table) => {
                                    const isSelected =
                                        selectedTable?.id === table.id;
                                    const isZone = table.shape === "zone";
                                    const isBooked =
                                        table.status !== "available"; // Booked atau Occupied

                                    // Pewarnaan dinamis untuk customer
                                    let styleClass = "";
                                    if (isZone) {
                                        styleClass =
                                            "bg-[#84746E]/5 border-[#84746E]/30 text-[#84746E]/40 border-4 border-dashed rounded-xl";
                                    } else {
                                        if (isBooked) {
                                            styleClass =
                                                "bg-[#E5E7EB] border-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed opacity-60 border-2";
                                        } else if (isSelected) {
                                            styleClass =
                                                "bg-[#CD8B62] border-[#A8643C] text-white shadow-lg scale-110 border-2 z-30";
                                        } else {
                                            styleClass =
                                                "bg-[#F5ECE7] border-[#D6C2BC] text-[#50281A] hover:bg-[#EAE0DA] hover:shadow-md cursor-pointer border-2 z-20 transition-all";
                                        }
                                        styleClass +=
                                            table.shape === "circle"
                                                ? " rounded-full"
                                                : " rounded-xl";
                                    }

                                    return (
                                        <button
                                            key={table.id}
                                            disabled={isBooked || isZone} // Zona tidak bisa diklik customer
                                            onClick={() =>
                                                setSelectedTable(table)
                                            }
                                            className={`absolute flex flex-col items-center justify-center font-['Plus_Jakarta_Sans'] transition-all duration-300 ${styleClass} ${isZone ? "z-0" : ""}`}
                                            style={{
                                                left: `${table.pos_x}%`,
                                                top: `${table.pos_y}%`,
                                                width:
                                                    table.width ||
                                                    (isZone ? 200 : 75),
                                                height:
                                                    table.height ||
                                                    (isZone ? 150 : 75),
                                            }}
                                        >
                                            {isZone ? (
                                                <span className="text-2xl font-black tracking-widest uppercase opacity-60 text-center break-words px-4">
                                                    {table.name}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-base font-bold tracking-tight text-center px-1 leading-tight">
                                                        {table.name}
                                                    </span>
                                                    <span className="text-[10px] opacity-80 font-medium mt-1">
                                                        {table.capacity} Kursi
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 z-30 flex items-center gap-4 rounded-xl border border-[#D6C2BC] bg-white px-4 py-2 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#F5ECE7] border border-[#D6C2BC]"></div>
                            <span className="text-xs font-medium text-[#52443F]">
                                Tersedia
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#E5E7EB] border border-[#D1D5DB]"></div>
                            <span className="text-xs font-medium text-[#9CA3AF]">
                                Dipesan
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#CD8B62] border border-[#A8643C]"></div>
                            <span className="text-xs font-medium text-[#52443F]">
                                Dipilih
                            </span>
                        </div>
                    </div>
                </div>

                {/* BAGIAN KANAN: DETAIL POSISI MEJA */}
                <aside className="w-full shrink-0 lg:w-[380px]">
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D6C2BC]/80 bg-white shadow-sm sticky top-[100px]">
                        <div className="border-b border-[#E7E5E4] p-6 pb-4">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                Detail Posisi Meja
                            </h2>
                            <p className="mt-1 text-sm text-[#52443F]">
                                Pilih meja yang sesuai dengan preferensi Anda.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 p-6 min-h-[300px]">
                            {selectedTable ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                                Meja Terpilih
                                            </span>
                                            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                                {selectedTable.name}
                                            </span>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5ECE7] text-[#50281A]">
                                            <span className="font-bold">
                                                {selectedTable.id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-[#E7E5E4]"></div>

                                    <div className="flex flex-col gap-5">
                                        <div className="flex gap-4">
                                            <div className="mt-0.5 text-[#50281A]">
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
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#1E1B18]">
                                                    Kapasitas Maksimal
                                                </span>
                                                <span className="text-sm text-[#52443F]">
                                                    {selectedTable.capacity}{" "}
                                                    Orang
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="mt-0.5 text-[#50281A]">
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
                                                        d="M3 21v-4m22 4v-4M5.5 17h13M5 10l7-7m0 0l7 7m-7-7v18"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#1E1B18]">
                                                    Lokasi Area
                                                </span>
                                                <span className="text-sm text-[#52443F]">
                                                    {selectedTable.area}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLanjutRingkasan}
                                        className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#50281A] text-sm font-semibold text-white shadow-md transition hover:bg-[#3d1e14]"
                                    >
                                        Lanjut ke Ringkasan
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
                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                            />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                                    <svg
                                        className="mb-2 h-12 w-12 text-[#D6C2BC]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                        />
                                    </svg>
                                    <p className="text-sm font-medium text-[#52443F]">
                                        Silakan pilih meja yang tersedia pada
                                        denah di samping.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* FOOTER */}
            <footer className="w-full border-t border-[#D6D3D1] bg-[#F5F1E9] py-12 mt-10">
                <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-10">
                    <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E]">
                        Booking Resto
                    </h2>
                    <div className="text-center text-xs text-[#57534E] md:text-right">
                        © 2026 Booking Resto <br className="hidden md:block" />{" "}
                        Keanggunan dalam setiap reservasi.
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function BookingPageWrapper({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#FCFAF8]">
                    <Loader2
                        className="animate-spin text-[#6B3E2E]"
                        size={40}
                    />
                </div>
            }
        >
            <BookingContent params={params} />
        </Suspense>
    );
}
