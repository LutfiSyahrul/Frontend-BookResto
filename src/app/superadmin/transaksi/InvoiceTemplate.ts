export const printInvoice = (trx: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Looping daftar makanan ke dalam baris tabel HTML
    const itemRows = trx.items
        .map(
            (item: any) => `
        <tr style="border-b: 1px solid #E9E1DC;">
            <td style="padding: 10px 0; color: #1E1B18; font-weight: 600;">${item.menu_name}</td>
            <td style="padding: 10px 0; text-align: center; color: #84746E;">${item.quantity}x</td>
            <td style="padding: 10px 0; text-align: right; color: #1E1B18;">Rp ${parseInt(item.price).toLocaleString("id-ID")}</td>
            <td style="padding: 10px 0; text-align: right; color: #1E1B18; font-weight: bold;">Rp ${(item.price * item.quantity).toLocaleString("id-ID")}</td>
        </tr>
    `,
        )
        .join("");

    printWindow.document.write(`
        <html>
        <head>
            <title>Invoice - ${trx.id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
                body { background: #ffffff; padding: 30px; margin: 0; color: #1E1B18; }
                .invoice-box { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E9E1DC; border-radius: 16px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #E9E1DC; padding-bottom: 20px; margin-bottom: 20px; }
                .logo { color: #50281A; font-weight: 800; font-size: 22px; text-decoration: none; }
                .badge { padding: 4px 12px; rounded-radius: 20px; font-size: 12px; font-weight: bold; background: #E8F5E9; color: #2E7D32; border-radius: 50px; display: inline-block; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; }
                .info-title { color: #84746E; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; }
                .info-value { color: #1E1B18; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
                th { background: #FFF8F5; color: #50281A; padding: 10px; font-weight: bold; text-align: left; }
                .summary-table td { padding: 5px 0; color: #60534E; }
                .total-row { border-top: 2px solid #50281A; font-size: 16px; font-weight: 800; color: #50281A; }
                .footer { text-align: center; font-size: 11px; color: #84746E; margin-top: 30px; border-top: 1px solid #E9E1DC; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <div>
                        <div class="logo">BookingResto</div>
                        <span style="font-size: 12px; color: #84746E;">ID Transaksi: <b>#${trx.id}</b></span>
                    </div>
                    <div class="text-right">
                        <span class="badge">${trx.status}</span>
                    </div>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="info-title">Pelanggan</div>
                        <div class="info-value">${trx.customer_name}</div>
                        <div style="color:#60534E;">${trx.customer_phone}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="info-title">Tempat & Waktu</div>
                        <div class="info-value" style="color: #50281A;">${trx.restaurant_name}</div>
                        <div style="color:#60534E;">${trx.reservation_date} @ ${trx.reservation_time}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Menu</th>
                            <th style="text-align:center;">Qty</th>
                            <th style="text-align:right;">Harga</th>
                            <th style="text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>

                <table class="summary-table" style="margin-top:10px; width:50%; margin-left:auto;">
                    <tr>
                        <td>Subtotal:</td>
                        <td style="text-align:right; font-weight:600;">Rp ${parseInt(trx.subtotal).toLocaleString("id-ID")}</td>
                    </tr>
                    <tr>
                        <td>Pajak (10%):</td>
                        <td style="text-align:right; font-weight:600;">Rp ${parseInt(trx.tax).toLocaleString("id-ID")}</td>
                    </tr>
                    <tr>
                        <td>Service Charge:</td>
                        <td style="text-align:right; font-weight:600;">Rp ${parseInt(trx.service_charge).toLocaleString("id-ID")}</td>
                    </tr>
                    <tr class="total-row">
                        <td style="padding-top:10px;">Total Bayar:</td>
                        <td style="text-align:right; padding-top:10px;">Rp ${parseInt(trx.total_price).toLocaleString("id-ID")}</td>
                    </tr>
                </table>

                <div style="margin-top: 20px; font-size: 12px; background: #FFF8F5; padding: 12px; border-radius: 8px; border-left: 4px solid #50281A;">
                    <b style="color:#50281A;">Metode Pembayaran:</b> ${trx.payment_method}<br/>
                    <b style="color:#50281A;">Catatan:</b> ${trx.notes}
                </div>

                <div class="footer">
                    Terima kasih telah melakukan reservasi melalui platform kami.<br/>
                    <b>BookingResto Console - Management Invoice Document</b>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
