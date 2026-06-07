interface PdfTemplateProps {
    stats: {
        totalReservasi: { value: string };
        tamuTerlayani: { value: string };
        pendapatan: { value: string };
        pembatalan: { value: string };
    };
    reservations: any[];
    currentMonthYear: string;
    userName: string;
    restaurantName: string;
}

export default function PdfTemplate({
    stats,
    reservations,
    currentMonthYear,
    userName,
    restaurantName,
}: PdfTemplateProps) {
    return (
        <div className="absolute top-[-10000px] left-[-10000px]">
            <div
                id="pdf-report-container"
                className="relative w-[1123px] min-h-[794px] bg-[#FFFFFF] p-12 font-sans text-[#1E1B18]"
            >
                {/* WATERMARK */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                    <span className="text-[90px] font-black rotate-[-30deg] uppercase tracking-widest text-center">
                        {restaurantName}
                    </span>
                </div>

                <div className="relative z-10">
                    {/* KOP SURAT */}
                    <div className="flex justify-between items-end border-b-4 border-[#50281A] pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-[#50281A] tracking-tight">
                                {restaurantName}
                            </h1>
                            <p className="text-lg font-semibold text-[#84746E] mt-1">
                                Laporan Performa & Reservasi Restoran
                            </p>
                        </div>
                        <div className="text-right text-sm text-[#52443F]">
                            <p>
                                <strong>Periode:</strong> Bulan{" "}
                                {currentMonthYear}
                            </p>
                            <p suppressHydrationWarning>
                                <strong>Waktu Cetak:</strong>{" "}
                                {new Date().toLocaleString("id-ID")}
                            </p>
                            <p>
                                <strong>Dicetak Oleh:</strong> {userName}
                            </p>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-[#FFF8F5] border border-[#E9E1DC] p-5 rounded-xl border-l-4 border-l-[#50281A]">
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Total Kunjungan
                            </p>
                            <p className="text-3xl font-black text-[#1E1B18] mt-2">
                                {stats.totalReservasi.value}{" "}
                                <span className="text-sm font-medium">Res</span>
                            </p>
                        </div>
                        <div className="bg-[#FFF8F5] border border-[#E9E1DC] p-5 rounded-xl border-l-4 border-l-[#1E524C]">
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Volume Tamu
                            </p>
                            <p className="text-3xl font-black text-[#1E1B18] mt-2">
                                {stats.tamuTerlayani.value}{" "}
                                <span className="text-sm font-medium">Pax</span>
                            </p>
                        </div>
                        <div className="bg-[#FFF8F5] border border-[#E9E1DC] p-5 rounded-xl border-l-4 border-l-[#A68A80]">
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Estimasi Omset
                            </p>
                            <p className="text-3xl font-black text-[#1E1B18] mt-2">
                                {stats.pendapatan.value}
                            </p>
                        </div>
                        <div className="bg-[#FFF8F5] border border-[#E9E1DC] p-5 rounded-xl border-l-4 border-l-[#93000A]">
                            <p className="text-xs font-bold text-[#84746E] uppercase">
                                Dibatalkan
                            </p>
                            <p className="text-3xl font-black text-[#1E1B18] mt-2">
                                {stats.pembatalan.value}{" "}
                                <span className="text-sm font-medium">Res</span>
                            </p>
                        </div>
                    </div>

                    {/* TABEL */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#1E1B18] border-b-2 border-[#D6C2BC] pb-2 mb-4">
                            Lampiran Data Reservasi Terbaru
                        </h3>
                        <table className="w-full text-left text-sm border-collapse">
                            <thead
                                style={{
                                    backgroundColor: "#EAE0DA",
                                    color: "#50281A",
                                }}
                            >
                                <tr>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        ID Reservasi
                                    </th>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        Nama Tamu
                                    </th>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        Waktu
                                    </th>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        Pax
                                    </th>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        Area
                                    </th>
                                    <th className="px-4 py-3 font-bold border border-[#E9E1DC]">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.slice(0, 10).map((res, i) => (
                                    <tr
                                        key={res.id}
                                        style={{
                                            backgroundColor:
                                                i % 2 === 0
                                                    ? "#FFFFFF"
                                                    : "#FCFAF8",
                                        }}
                                    >
                                        <td className="px-4 py-2.5 font-semibold text-[#1E1B18] border border-[#E9E1DC]">
                                            {res.id}
                                        </td>
                                        <td className="px-4 py-2.5 border border-[#E9E1DC]">
                                            {res.name}
                                        </td>
                                        <td className="px-4 py-2.5 border border-[#E9E1DC]">
                                            {res.datetime}
                                        </td>
                                        <td className="px-4 py-2.5 border border-[#E9E1DC]">
                                            {res.pax} Org
                                        </td>
                                        <td className="px-4 py-2.5 border border-[#E9E1DC]">
                                            {res.area}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold border border-[#E9E1DC]">
                                            {res.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-end pt-12 border-t border-[#E9E1DC]">
                        <div className="text-xs text-[#84746E]">
                            <p>
                                Dokumen ini di-generate otomatis oleh Sistem{" "}
                                {restaurantName}.
                            </p>
                            <p>Rahasia Internal Restorant.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
