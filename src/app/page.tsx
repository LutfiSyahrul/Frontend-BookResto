"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [isLeaving, setIsLeaving] = useState(false); // <State untuk animasi keluar

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsLeaving(true); // Memulai animasi fade out yang mulus

                    // Tunggu animasi fade out selesai (500ms), baru pindah ke Beranda
                    setTimeout(() => {
                        // DIUBAH: Dari "/login" menjadi "/beranda"
                        router.push("/beranda");
                    }, 500);

                    return 100;
                }
                return prev + 1;
            });
        }, 30); // Kecepatan progress bar

        return () => clearInterval(interval);
    }, [router]);

    return (
        // Tambahkan transisi di class utama ini
        <main
            className={`relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black m-0 p-0 transition-opacity duration-500 ease-in-out ${isLeaving ? "opacity-0" : "opacity-100"}`}
        >
            <div className="absolute inset-0 z-0 h-full w-full">
                <Image
                    src="/bg-splash.png"
                    alt="Background Splash Screen"
                    fill
                    sizes="100vw"
                    priority
                    className="object-cover"
                />
            </div>

            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[rgba(80,40,26,0.95)] via-[rgba(107,62,46,0.80)] to-transparent backdrop-blur-md" />
            <div className="absolute inset-0 z-10 bg-[rgba(80,40,26,0.40)] mix-blend-multiply" />

            <div className="relative z-20 flex w-full max-w-[448px] flex-col items-center justify-center px-6">
                <div className="flex flex-col items-center justify-start pb-16 sm:pb-20">
                    <h1 className="text-center font-['Plus_Jakarta_Sans'] text-4xl font-bold uppercase leading-tight tracking-[4.8px] text-[#F8B8A2] sm:text-[48px] sm:leading-[56px] drop-shadow-lg">
                        Booking Resto
                    </h1>
                </div>

                <div className="flex w-full flex-col items-center justify-start pt-16 sm:pt-20">
                    <div className="mb-6 flex w-64 flex-col items-start justify-start">
                        <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-[rgba(214,194,188,0.20)] backdrop-blur-[2px]">
                            <div
                                className="absolute left-0 top-0 h-full rounded-full bg-[#F8B8A2] shadow-[0px_0px_8px_rgba(248,184,162,0.60)] transition-all duration-75 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-start px-2 text-center">
                        <p className="font-['Inter'] text-xs font-semibold uppercase leading-5 tracking-[1.40px] text-[#E9E1DC] sm:text-sm drop-shadow-md">
                            Menyiapkan Pengalaman Kuliner Terbaik
                            <br />
                            Anda...
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
