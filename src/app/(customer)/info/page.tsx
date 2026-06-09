"use client";

import { useState } from "react";
import Link from "next/link"; // Jangan lupa import Link untuk tombol kembali

export default function InfoPage() {
    const [activeTab, setActiveTab] = useState("about");

    const tabs = [
        { id: "about", label: "Tentang Kami", icon: "🏢" },
        { id: "help", label: "Pusat Bantuan", icon: "💬" },
        { id: "terms", label: "Syarat & Ketentuan", icon: "📜" },
        { id: "privacy", label: "Kebijakan Privasi", icon: "🔒" },
    ];

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#FDFCFB] px-4 py-8 font-['Inter'] md:px-12 lg:px-24">
            {/* Tombol Kembali */}
            <div className="mb-4">
                <Link
                    href="/beranda"
                    className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#78716C] transition-all hover:bg-[#F5ECE7] hover:text-[#50281A]"
                >
                    <svg
                        className="h-5 w-5 transition-transform group-hover:-translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Kembali ke Beranda
                </Link>
            </div>

            {/* Header Section */}
            <div className="text-center mt-2">
                <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold tracking-tight text-[#50281A]">
                    Pusat Informasi
                </h1>
                <p className="mt-3 text-sm text-[#78716C] max-w-md mx-auto">
                    Temukan segala informasi mengenai layanan, bantuan, serta
                    kebijakan operasional Booking Resto di satu tempat.
                </p>
            </div>

            {/* Main Content Layout */}
            <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-start">
                {/* Left Side: Interactive Navigation Tabs */}
                <div className="flex w-full flex-row gap-2 overflow-x-auto pb-2 lg:w-1/4 lg:flex-col lg:overflow-visible lg:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex min-w-[150px] items-center gap-3 rounded-xl px-5 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? "bg-[#50281A] text-white shadow-md shadow-[#50281A]/10"
                                    : "bg-[#F5ECE7]/40 text-[#78716C] hover:bg-[#F5ECE7]/80 hover:text-[#50281A]"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Side: Dynamic Content Card */}
                <div className="w-full rounded-3xl border border-[#D6C2BC]/40 bg-[#F5ECE7]/20 p-6 md:p-8 lg:w-3/4">
                    {/* 1. TENTANG KAMI */}
                    {activeTab === "about" && (
                        <div className="animate-fadeIn space-y-4">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                Tentang Booking Resto
                            </h2>
                            <p className="text-sm leading-relaxed text-[#1E1B18]">
                                <span className="font-bold">Booking Resto</span>{" "}
                                adalah platform digital inovatif yang dirancang
                                khusus untuk mempermudah ekosistem kuliner,
                                menjembatani para pencinta kuliner dengan
                                restoran favorit mereka secara elegan dan
                                efisien.
                            </p>
                            <p className="text-sm leading-relaxed text-[#1E1B18]">
                                Kami percaya bahwa menikmati hidangan terbaik
                                tidak harus diawali dengan antrean yang
                                melelahkan. Melalui fitur unggulan seperti{" "}
                                <span className="font-bold">
                                    Denah Meja Interaktif 360 derajat
                                </span>
                                , pemilihan menu langsung, hingga integrasi
                                pembayaran otomatis yang aman, kami memastikan
                                setiap momen reservasi Anda berjalan sempurna
                                dari hulu ke hilir. Salah satu mitra utama kami
                                saat ini adalah{" "}
                                <span className="font-bold">
                                    Waroeng Jamboel
                                </span>
                                , tempat keanggunan rasa berpadu dengan
                                kenyamanan maksimal.
                            </p>
                        </div>
                    )}

                    {/* 2. PUSAT BANTUAN */}
                    {activeTab === "help" && (
                        <div className="animate-fadeIn space-y-5">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                Pertanyaan yang Sering Diajukan (FAQ)
                            </h2>
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#D6C2BC]/20">
                                    <h4 className="font-semibold text-[#50281A] text-sm">
                                        💡 Bagaimana cara mengonfirmasi
                                        pembayaran saya?
                                    </h4>
                                    <p className="mt-1 text-xs text-[#78716C] leading-relaxed">
                                        Sistem kami terintegrasi otomatis dengan
                                        Midtrans Payment Gateway. Begitu Anda
                                        menyelesaikan transfer via VA atau
                                        E-Wallet, status tiket Anda akan
                                        langsung berubah menjadi "Reservasi
                                        Berhasil" secara real-time tanpa perlu
                                        konfirmasi manual.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#D6C2BC]/20">
                                    <h4 className="font-semibold text-[#50281A] text-sm">
                                        ⏳ Berapa lama batas waktu pembayaran
                                        tiket pending?
                                    </h4>
                                    <p className="mt-1 text-xs text-[#78716C] leading-relaxed">
                                        Batas waktu mengikuti aturan transaksi
                                        yang diterbitkan oleh Midtrans (biasanya
                                        15-20 menit tergantung bank penampung).
                                        Jika melewati batas, pesanan otomatis
                                        hangus dan meja akan dilepas kembali ke
                                        publik.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#D6C2BC]/20">
                                    <h4 className="font-semibold text-[#50281A] text-sm">
                                        📞 Hubungi Customer Service Kami
                                    </h4>
                                    <p className="mt-1 text-xs text-[#78716C] leading-relaxed">
                                        Butuh bantuan darurat terkait penataan
                                        meja atau kendala sistem? Hubungi
                                        helpdesk kami via WhatsApp di nomor
                                        resmi yang tertera pada bagian detail
                                        restoran mitra.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. SYARAT & KETENTUAN */}
                    {activeTab === "terms" && (
                        <div className="animate-fadeIn space-y-4">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                Syarat & Ketentuan Penggunaan
                            </h2>
                            <ul className="list-inside list-disc space-y-3 text-sm text-[#1E1B18] leading-relaxed">
                                <li>
                                    Pengguna wajib mengisi data diri yang valid
                                    (Nama dan Nomor WhatsApp aktif) untuk
                                    keperluan pengiriman notifikasi e-tiket.
                                </li>
                                <li>
                                    Reservasi meja dianggap sah dan mengikat
                                    apabila pembayaran telah berstatus{" "}
                                    <span className="font-bold">
                                        Settlement
                                    </span>{" "}
                                    atau berhasil di sistem payment gateway
                                    kami.
                                </li>
                                <li>
                                    Konsumen diharapkan hadir paling lambat 15
                                    menit sebelum waktu reservasi yang dipilih.
                                    Keterlambatan lebih dari 30 menit tanpa
                                    konfirmasi dapat mengakibatkan pembatalan
                                    sepihak oleh pihak manajemen restoran.
                                </li>
                                <li>
                                    Dana yang sudah ditransfer untuk pesanan
                                    menu makanan tidak dapat di-refund atau
                                    diuangkan kembali apabila terjadi pembatalan
                                    sepihak oleh konsumen pada hari-H.
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* 4. KEBIJAKAN PRIVASI */}
                    {activeTab === "privacy" && (
                        <div className="animate-fadeIn space-y-4">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#50281A]">
                                Kebijakan Privasi Data Pengguna
                            </h2>
                            <p className="text-sm leading-relaxed text-[#1E1B18]">
                                Di Booking Resto, keamanan informasi privasi
                                Anda adalah prioritas mutlak kami. Kami
                                berkomitmen penuh melindungi data personal
                                konsumen dengan standar enkripsi terbaik.
                            </p>
                            <ul className="list-outside list-disc space-y-3 pl-4 text-sm text-[#1E1B18] leading-relaxed">
                                <li>
                                    <span className="font-bold">
                                        Pengumpulan Data:
                                    </span>{" "}
                                    Kami hanya merekam informasi dasar seperti
                                    Nama, Alamat Email, dan Nomor Kontak
                                    WhatsApp yang diinput secara sadar oleh
                                    pengguna saat mendaftar atau checkout
                                    transaksi.
                                </li>
                                <li>
                                    <span className="font-bold">
                                        Keamanan Pembayaran:
                                    </span>{" "}
                                    Seluruh data sensitif terkait kartu kredit,
                                    rekening bank, atau akun dompet digital
                                    diproses langsung melalui jaringan aman{" "}
                                    <span className="font-bold">
                                        Midtrans API
                                    </span>{" "}
                                    menggunakan enkripsi berlapis, tanpa
                                    menyentuh database internal kami.
                                </li>
                                <li>
                                    <span className="font-bold">
                                        Pemanfaatan Informasi:
                                    </span>{" "}
                                    Kontak Anda digunakan murni untuk validasi
                                    kehadiran di meja restoran, pengiriman token
                                    akses AI, serta pengiriman e-tiket reservasi
                                    resmi.
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
