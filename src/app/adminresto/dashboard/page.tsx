"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();
                // troubleshoot:
                //console.log(data);
                if (data.success) {
                    setDashboardData(data.data);
                    setRestaurantName(data.restaurant_name);
                }
            } catch (error) {
                console.error("Gagal memuat data dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 text-[#6B3E2E]">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-sm font-medium">
                    Sinkronisasi data dapur...
                </p>
            </div>
        );
    }

    // Fallback jika data kosong
    const stats = dashboardData?.stats || {
        reservations_today: 0,
        active_tables: 0,
        total_guests: 0,
    };
    const recentBookings = dashboardData?.recent_bookings || [];

    // Ambil grafik dari database, fallback ke array kosong jika belum ada
    const chartData = dashboardData?.chart_data || [];

    // RUMUS PAGINASI FRONTEND 
    const itemsPerPage = 5;
    const totalPages = Math.ceil(recentBookings.length / itemsPerPage);
    const paginatedBookings = recentBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            {/* HEADER DASHBOARD */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                        Ikhtisar Restoran{" "}
                        {restaurantName && (
                            <span className="text-[#6B3E2E]">
                                {restaurantName}
                            </span>
                        )}
                    </h2>
                    <p className="mt-1 text-[#52443F]">
                        Pantau performa real-time restoran Anda di sini.
                    </p>
                </div>
                <div className="inline-flex rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] px-4 py-2 text-sm font-semibold tracking-wide text-[#52443F]">
                    Hari Ini
                </div>
            </div>

            {/* STATS CARDS (GRID) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard
                    title="RESERVASI HARI INI"
                    value={stats.reservations_today}
                    subtitle="Reservasi masuk"
                    color="text-[#1E524C]"
                    bgIcon="bg-[#50281A]/10"
                    iconColor="text-[#50281A]"
                />
                <StatCard
                    title="MEJA AKTIF"
                    value={stats.active_tables}
                    subtitle="/ 20 Meja"
                    isProgress
                    color="text-[#1E1B18]"
                    bgIcon="bg-[#1E524C]/10"
                    iconColor="text-[#1E524C]"
                />
                <StatCard
                    title="TOTAL PENGUNJUNG"
                    value={stats.total_guests}
                    subtitle="Orang berkunjung"
                    color="text-[#1E1B18]"
                    bgIcon="bg-[#50281A]/10"
                    iconColor="text-[#50281A]"
                />
            </div>

            {/* CHARTS & RECENT BOOKINGS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* TREN RESERVASI */}
                <div className="flex flex-col rounded-2xl border border-[#E1D8D4] bg-[#F5F1E9] p-6 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                            Tren Reservasi
                        </h3>
                        <span className="rounded-lg border border-[#D6C2BC] bg-[#FFF8F5] px-3 py-1 text-sm font-medium text-[#1E1B18]">
                            Minggu Ini
                        </span>
                    </div>
                    <div className="relative flex h-48 items-end justify-around border-b border-[#D6C2BC]/30 pb-2 pt-6">
                        {chartData.length > 0 ? (
                            chartData.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center justify-end h-full w-full relative group"
                                >
                                    {/* SUNTIKAN ANGKA JUMLAH RESERVASI DI ATAS BATANG */}
                                    <span className="mb-1 text-[10px] font-bold text-[#50281A]">
                                        {item.count || 0}
                                    </span>

                                    {/* BATANG GRAFIK DINAMIS */}
                                    <div
                                        className="w-8 md:w-12 rounded-t-md transition-all duration-500 bg-[#6B3E2E] hover:bg-[#50281A] shadow-[0_0_12px_rgba(107,62,46,0.1)]"
                                        style={{
                                            height: `${item.percentage || 0}%`,
                                        }}
                                    ></div>

                                    <span className="mt-2 text-xs font-bold text-[#52443F]">
                                        {item.day}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#78716C]">
                                Belum ada data tren minggu ini.
                            </div>
                        )}
                    </div>
                </div>

                {/* BOOKING BARU (RIIL DARI DATABASE) */}
                <div className="flex flex-col rounded-2xl border border-[#E1D8D4] bg-[#F5F1E9] p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                            Booking Baru
                        </h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        {paginatedBookings.length > 0 ? (
                            paginatedBookings.map((booking: any) => (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between rounded-xl p-2 transition hover:bg-white/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#50281A]/10 text-[#50281A] font-['Plus_Jakarta_Sans'] font-bold uppercase">
                                            {booking.customer_name
                                                ? booking.customer_name.charAt(
                                                      0,
                                                  )
                                                : "G"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1E1B18]">
                                                {booking.customer_name}
                                            </p>
                                            <p className="text-xs text-[#52443F]">
                                                {booking.guests} Pax •{" "}
                                                {booking.area ||
                                                    "Belum Pilih Meja"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#50281A]">
                                            {booking.reservation_time
                                                ? booking.reservation_time.substring(
                                                      0,
                                                      5,
                                                  )
                                                : "-"}
                                        </p>
                                        <p className="text-[10px] font-semibold text-[#52443F] uppercase">
                                            {booking.status}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-sm text-[#78716C]">
                                Belum ada data booking masuk hari ini.
                            </p>
                        )}
                    </div>

                    {/* TOMBOL PAGINASI DINAMIS */}
                    <div className="mt-6 flex items-center justify-between border-t border-[#D6C2BC]/40 pt-4">
                        <span className="text-xs text-[#78716C]">
                            Menampilkan{" "}
                            {recentBookings.length > 0
                                ? (currentPage - 1) * itemsPerPage + 1
                                : 0}
                            -
                            {Math.min(
                                currentPage * itemsPerPage,
                                recentBookings.length,
                            )}{" "}
                            dari {recentBookings.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1),
                                    )
                                }
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#78716C] transition hover:bg-white disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#50281A] text-white font-bold">
                                {currentPage}
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages),
                                    )
                                }
                                disabled={
                                    currentPage === totalPages ||
                                    totalPages === 0
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#D6C2BC] text-[#78716C] transition hover:bg-white disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    color,
    bgIcon,
    iconColor,
    isProgress = false,
}: any) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-[#E1D8D4] bg-[#F5F1E9] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#52443F]">
                    {title}
                </span>
                <div className={`rounded-lg p-2 ${bgIcon} ${iconColor}`}>
                    <CalendarDays size={16} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#1E1B18]">
                    {value}
                </h3>
                <span className={`text-sm font-medium ${color} ml-2`}>
                    {subtitle}
                </span>
            </div>
            {isProgress && (
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#E1D8D4]">
                    <div className="h-full w-[60%] rounded-full bg-[#1E524C]"></div>
                </div>
            )}
        </div>
    );
}
