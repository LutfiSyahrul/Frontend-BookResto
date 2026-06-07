"use client";

import { useState, useEffect, Suspense, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

// Tipe data untuk meja
interface SelectedTable {
    id: string;
    name: string;
    capacity: string;
    view: string;
}

// PERUBAHAN: Menambahkan params untuk menangkap [id] dari folder
function KonfirmasiContent({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // BACA ID DARI FOLDER [id]
    const resolvedParams = use(params);
    const restoranId = resolvedParams.id;

    // Data dari URL
    const reserveDate = searchParams.get("date") || "";
    const reserveTime = searchParams.get("time") || "-";
    const reserveGuests = searchParams.get("guests") || "2";

    // State UI & Data Lokal
    const [isVisible, setIsVisible] = useState(false);
    const [tableData, setTableData] = useState<SelectedTable | null>(null);

    // STATE FORM PEMESAN
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");

    const [menuSubtotal, setMenuSubtotal] = useState(0);
    const [menuItems, setMenuItems] = useState<any[]>([]);

    // STATE UNTUK PERSENTASE PAJAK & LAYANAN
    const [taxPercent, setTaxPercent] = useState<number>(11);
    const [servicePercent, setServicePercent] = useState<number>(5);

    const [restoImage, setRestoImage] = useState(
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    );
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
    });

    useEffect(() => {
        setIsVisible(true);

        axios
            .get(`${process.env.NEXT_PUBLIC_API_URL}/settings`)
            .then((res) => {
                if (res.data.success && res.data.data) {
                    // dikonversi ke Number (angka)
                    setTaxPercent(Number(res.data.data.tax_rate) || 0);
                    setServicePercent(Number(res.data.data.service_rate) || 0);
                }
            })
            .catch((err) => console.log("Gagal ambil setting pajak", err));

        // Tarik gambar dinamis dari backend
        if (restoranId) {
            axios
                .get(`${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restoranId}`)
                .then((res) => {
                    if (res.data.success && res.data.data.image_url) {
                        let imgUrl = res.data.data.image_url;

                        // Jika URL tidak diawali 'http', berarti itu nama file dari database.
                        // Kita gabungkan dengan alamat backend Laravel.
                        if (!imgUrl.startsWith("http")) {
                            // Hapus garis miring di awal jika ada, biar tidak dobel
                            const cleanPath = imgUrl.replace(/^\/+/, "");
                            imgUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${cleanPath}`;
                        }

                        setRestoImage(imgUrl);
                    }
                })
                .catch((err) => console.log("Gagal ambil gambar resto", err));
        }

        const savedTable = localStorage.getItem("selectedTable");
        const savedMenu = localStorage.getItem("pesananMenu");

        if (!savedTable) {
            setAlertConfig({
                isOpen: true,
                title: "Sesi Habis",
                message: "Sesi reservasi Anda sudah selesai atau kadaluarsa.",
            });
            setTimeout(() => router.push("/"), 2000);
            return;
        }

        setTableData(JSON.parse(savedTable));

        if (savedMenu) {
            const items = JSON.parse(savedMenu);
            setMenuItems(items); // <-- Simpan ke state untuk ditampilkan nanti
            const total = items.reduce(
                (sum: number, item: any) => sum + item.price * item.quantity,
                0,
            );
            setMenuSubtotal(total);
        }
    }, [router, restoranId]);

    const formatFullDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    };

    // LOGIKA PERHITUNGAN
    const guestsCount = parseInt(reserveGuests);
    const biayaPerTamu = 150000;
    const subTotalReservasi = guestsCount * biayaPerTamu;

    // PERSENTASE DINAMIS DARI DATABASE 
    const pajak = menuSubtotal * (taxPercent / 100);
    const layanan = menuSubtotal * (servicePercent / 100);
    const totalPembayaran = menuSubtotal + pajak + layanan;

    const handleLanjutPembayaran = async () => {
        // 1. Validasi Input Dasar
        if (!customerName.trim() || !customerPhone.trim()) {
            setAlertConfig({
                isOpen: true,
                title: "Input Tidak Lengkap",
                message: "Mohon lengkapi Nama Lengkap dan Nomor WhatsApp.",
            });
            return;
        }

        try {
            // AMBIL TOKEN DARI STORAGE (Ini KTP-nya!)
            const token = localStorage.getItem("token");
            if (!token) {
                setAlertConfig({
                    isOpen: true,
                    title: "Login Diperlukan",
                    message:
                        "Gagal: Anda harus login terlebih dahulu untuk melakukan reservasi.",
                });
                // Jika bos punya halaman login, bisa di-redirect ke sini:
                // router.push("/login");
                return;
            }

            const savedMenu = localStorage.getItem("pesananMenu");
            const menuItems = savedMenu ? JSON.parse(savedMenu) : [];

            // 2. AMBIL ID MEJA ASLI DARI DATABASE
            // Kita langsung ambil dari tableData.id yang tersimpan di localStorage, kalau kosong (misal dipilihkan), set ke null.
            const dbTableId = tableData?.id ? Number(tableData.id) : null;

            // 3. Susun Data (Langsung pakai variabel yang benar)
            const payloadTransaksi = {
                restaurant_id: Number(restoranId),
                table_id: dbTableId,
                customer_name: customerName,
                customer_phone: customerPhone,
                reservation_date: reserveDate,
                reservation_time: reserveTime,
                guests: Number(reserveGuests),
                notes: notes,
                subtotal: menuSubtotal,
                tax: pajak,
                service_charge: layanan,
                total_price: totalPembayaran,
                items: menuItems,
            };

            //console.log("Mengirim data ke Laravel...", payloadTransaksi);

            // 4. Tembak ke API Laravel DENGAN MEMBAWA TOKEN
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
                payloadTransaksi,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`, // <--- INI OBATNYA (KTP MASUK)
                    },
                },
            );

            if (response.data.success) {
                const orderId = response.data.data.order_id;

                // Bersihkan storage
                localStorage.removeItem("pesananMenu");
                localStorage.removeItem("selectedTable");

                // 5. PINDAH KE HALAMAN PEMBAYARAN
                router.push(
                    `/restoran/${restoranId}/pembayaran?order_id=${orderId}`,
                );
            }
        } catch (error: any) {
            if (error.response) {
                console.error("Status Error:", error.response.status);
                console.error(
                    "Detail Error Laravel:",
                    JSON.stringify(error.response.data, null, 2),
                );

                if (error.response.status === 422) {
                    const pesanValidasi =
                        error.response.data.message ||
                        "Ada isian yang tidak sesuai dengan database.";
                    setAlertConfig({
                        isOpen: true,
                        title: "Gagal Validasi",
                        message: `Gagal Validasi: ${pesanValidasi} (Cek Console F12 untuk detail kolom yang salah)`,
                    });
                } else if (error.response.status === 401) {
                    setAlertConfig({
                        isOpen: true,
                        title: "Sesi Habis",
                        message:
                            "Gagal: Sesi login Anda telah habis. Silakan login ulang.",
                    });
                } else if (error.response.status === 500) {
                    setAlertConfig({
                        isOpen: true,
                        title: "Error Server",
                        message:
                            "Gagal: Terjadi error di dalam kodingan/database Laravel. Cek terminal Laravel bos!",
                    });
                } else if (error.response.status === 404) {
                    setAlertConfig({
                        isOpen: true,
                        title: "Endpoint Tidak Ditemukan",
                        message:
                            "Gagal: Endpoint /api/checkout tidak ditemukan di route Laravel.",
                    });
                } else {
                    setAlertConfig({
                        isOpen: true,
                        title: "Error Tidak Dikenal",
                        message: `Gagal: Error kode ${error.response.status}.`,
                    });
                }
            } else if (error.request) {
                console.error("Tidak ada respon dari server.");
                setAlertConfig({
                    isOpen: true,
                    title: "Tidak Ada Respon",
                    message:
                        "Gagal: Tidak bisa terhubung ke server Laravel. Pastikan php artisan serve masih jalan.",
                });
            } else {
                console.error("Eror Konfigurasi:", error.message);
            }
        }
    };

    return (
        <div
            className={`relative min-h-screen w-full bg-[#FCFAF8] font-['Inter'] transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
            <nav className="sticky top-0 z-50 flex h-[72px] w-full items-center border-b border-[#D6C2BC]/30 bg-[#FCFAF8]/95 px-6 backdrop-blur-md lg:px-10">
                <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[#50281A] transition-all duration-300 hover:bg-[#F5ECE7] hover:-translate-x-1"
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
                                strokeWidth={2.5}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                    </button>
                    <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#50281A]">
                        Booking Resto
                    </h1>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start lg:gap-12 lg:px-10 lg:py-12">
                {/* KOLOM KIRI */}
                <div className="flex w-full flex-col gap-8 lg:flex-1">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                            Ringkasan Reservasi
                        </h2>
                        <p className="text-[#52443F]">
                            Periksa kembali detail reservasi Anda sebelum
                            melanjutkan ke pembayaran.
                        </p>
                    </div>

                    {/* Kartu 1: Detail Restoran */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D6C2BC]/50 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                        <div className="h-40 w-full overflow-hidden bg-gray-200 md:h-48">
                            <img
                                src={restoImage}
                                alt="Restoran"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col p-6 md:p-8">
                            <h3 className="mb-6 font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                Restoran Terpilih
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="flex gap-4">
                                    <svg
                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#78716C]"
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
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                            Tanggal
                                        </span>
                                        <span className="font-medium text-[#1E1B18]">
                                            {formatFullDate(reserveDate)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <svg
                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#78716C]"
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
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                            Waktu
                                        </span>
                                        <span className="font-medium text-[#1E1B18]">
                                            {reserveTime} WIB
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <svg
                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#78716C]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                            Jumlah Tamu
                                        </span>
                                        <span className="font-medium text-[#1E1B18]">
                                            {reserveGuests} Orang
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <svg
                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#78716C]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                            Area Meja
                                        </span>
                                        <span className="font-medium text-[#1E1B18]">
                                            {tableData?.name || "Memuat..."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kartu 2: Data Pemesan & Catatan */}
                    <div className="flex flex-col rounded-2xl border border-[#D6C2BC]/50 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-6 flex flex-col border-b border-[#D6C2BC]/50 pb-6">
                            <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                Data Pemesan
                            </h3>
                            <p className="mt-1 text-sm text-[#52443F]">
                                Informasi ini diperlukan untuk konfirmasi
                                reservasi via WhatsApp.
                            </p>

                            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) =>
                                            setCustomerName(e.target.value)
                                        }
                                        placeholder="Cth: Ahmad Saboli"
                                        className="h-12 w-full rounded-xl border border-[#D6C2BC] bg-[#FDFCFB] px-4 text-sm text-[#1E1B18] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A]"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                        Nomor WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) =>
                                            setCustomerPhone(e.target.value)
                                        }
                                        placeholder="Cth: 081xxxxxxxx"
                                        className="h-12 w-full rounded-xl border border-[#D6C2BC] bg-[#FDFCFB] px-4 text-sm text-[#1E1B18] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                                Catatan Tambahan{" "}
                                <span className="text-sm font-normal text-[#A8A29E]">
                                    (Opsional)
                                </span>
                            </h3>
                            <p className="mt-1 text-sm text-[#52443F]">
                                Beritahu restoran mengenai alergi, perayaan
                                khusus, atau permintaan meja spesifik.
                            </p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Alergi kacang, ulang tahun pernikahan ke-5..."
                                className="mt-4 h-28 w-full resize-none rounded-xl border border-[#D6C2BC] bg-[#FDFCFB] p-4 text-sm text-[#1E1B18] outline-none transition-all placeholder:text-[#A8A29E] focus:border-[#50281A] focus:ring-1 focus:ring-[#50281A]"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <aside className="w-full shrink-0 lg:w-[400px]">
                    <div className="sticky top-[100px] flex flex-col rounded-2xl bg-[#EBE7E0] p-6 shadow-md md:p-8">
                        <h3 className="mb-6 font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#50281A]">
                            Rincian Biaya
                        </h3>

                        {menuItems.length > 0 && (
                            <div className="mb-6 flex flex-col gap-3 border-b border-[#D6C2BC] pb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                                    Daftar Pesanan
                                </span>
                                {menuItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start justify-between text-sm"
                                    >
                                        <div className="flex gap-2 text-[#1E1B18]">
                                            <span className="font-semibold text-[#50281A]">
                                                {item.quantity}x
                                            </span>
                                            <span className="capitalize">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="font-medium text-[#1E1B18]">
                                            Rp{" "}
                                            {(
                                                item.price * item.quantity
                                            ).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-4 border-b border-[#D6C2BC] pb-6 text-sm text-[#52443F]">
                            
                            <div className="flex items-center justify-between">
                                {/* BAGIAN YANG DIUBAH 1: Teks Label dan Variabel Subtotal */}
                                <span>Subtotal Menu</span>
                                <span className="font-medium text-[#1E1B18]">
                                    Rp {menuSubtotal.toLocaleString("id-ID")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                {/* BAGIAN YANG DIUBAH 2: Variabel Pajak Dinamis */}
                                <span>Pajak ({taxPercent}%)</span>
                                <span className="font-medium text-[#1E1B18]">
                                    Rp {pajak.toLocaleString("id-ID")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                {/* BAGIAN YANG DIUBAH 3: Variabel Layanan Dinamis */}
                                <span>Biaya Layanan ({servicePercent}%)</span>
                                <span className="font-medium text-[#1E1B18]">
                                    Rp {layanan.toLocaleString("id-ID")}
                                </span>
                            </div>

                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-xl font-bold text-[#1E1B18]">
                                Total
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#1E1B18]">
                                {/* BAGIAN YANG DIUBAH 4: Variabel Total Pembayaran Dinamis */}
                                Rp {totalPembayaran.toLocaleString("id-ID")}
                            </span>
                        </div>

                        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#78716C] md:text-xs">
                            Biaya ini adalah total tagihan menu makanan Anda di
                            restoran beserta pajak dan layanannya.
                        </p>

                        <button
                            onClick={handleLanjutPembayaran}
                            className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#50281A] text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#3d1e14] hover:shadow-[#50281A]/30"
                        >
                            Lanjut ke Pembayaran
                            <svg
                                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                            </svg>
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 text-[#78716C]">
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
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <span className="text-xs font-medium">
                                Pembayaran Aman & Terenkripsi
                            </span>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="mt-auto w-full bg-[#F5F1E9] py-12 pb-12">
                {/* Footer Sama seperti sebelumnya */}
                <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-10">
                    <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#6B3E2E]">
                        Booking Resto
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#78716C]">
                        <span className="cursor-pointer hover:text-[#6B3E2E] transition">
                            Tentang Kami
                        </span>
                        <span className="cursor-pointer hover:text-[#6B3E2E] transition">
                            Pusat Bantuan
                        </span>
                        <span className="cursor-pointer hover:text-[#6B3E2E] transition">
                            Syarat & Ketentuan
                        </span>
                        <span className="cursor-pointer hover:text-[#6B3E2E] transition">
                            Kebijakan Privasi
                        </span>
                    </div>
                    <div className="text-center text-xs text-[#57534E] md:text-right">
                        © 2026 Booking Resto <br className="hidden md:block" />{" "}
                        Keanggunan dalam setiap reservasi.
                    </div>
                </div>
            </footer>

            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div className="flex w-[90%] max-w-[380px] flex-col items-center rounded-2xl bg-white p-6 shadow-2xl text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1E1B18]">
                            {alertConfig.title}
                        </h3>
                        <p className="mb-6 text-sm text-[#52443F]">
                            {alertConfig.message}
                        </p>
                        <button
                            onClick={() =>
                                setAlertConfig({
                                    ...alertConfig,
                                    isOpen: false,
                                })
                            }
                            className="w-full rounded-xl bg-[#6B3E2E] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#50281A]"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// PERUBAHAN: Menambahkan params di Wrapper
export default function KonfirmasiPageWrapper({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#FCFAF8]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D6C2BC] border-t-[#50281A]"></div>
                </div>
            }
        >
            <KonfirmasiContent params={params} />
        </Suspense>
    );
}
