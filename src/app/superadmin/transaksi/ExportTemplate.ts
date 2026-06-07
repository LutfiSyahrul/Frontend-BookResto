import * as XLSX from "xlsx";

export const exportToExcel = (data: any[]) => {
    // 1. Mapping data agar nama kolom di Excel otomatis rapi (Huruf Besar & Ber-spasi)
    const formattedData = data.map((trx) => ({
        "ID TRANSAKSI": trx.id,
        "WAKTU TRANSAKSI": trx.waktu,
        "NAMA RESTORAN": trx.restoran,
        "NAMA CUSTOMER": trx.customer,
        "TOTAL PEMBAYARAN (RP)": trx.jumlah,
        "METODE PEMBAYARAN": trx.metode,
        STATUS: trx.status,
    }));

    // 2. Membuat Worksheet dan Workbook baru
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Transaksi");

    // 3. JURUS OTOMATIS RAFI: Mengatur lebar kolom agar menyesuaikan panjang teks (Auto-fit)
    const columnWidths: { wch: number }[] = [];
    const headers = Object.keys(formattedData[0] || {});

    // Set lebar default berdasarkan panjang nama Header
    headers.forEach((header) => {
        columnWidths.push({ wch: header.length + 5 });
    });

    // Cek setiap baris data, jika ada teks yang lebih panjang, lebarkan kolomnya
    formattedData.forEach((row: any) => {
        headers.forEach((header, index) => {
            const cellValue = row[header] ? row[header].toString() : "";
            if (cellValue.length > columnWidths[index].wch) {
                columnWidths[index].wch = cellValue.length + 3;
            }
        });
    });

    // Terapkan ukuran kolom ke worksheet
    worksheet["!cols"] = columnWidths;

    // 4. Download file langsung sebagai .xlsx berkilau
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Laporan_Transaksi_${dateStr}.xlsx`);
};
