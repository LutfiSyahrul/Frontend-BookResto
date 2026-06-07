import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Booking Resto", 
    description: "",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body suppressHydrationWarning className="m-0 p-0 antialiased">
                {children}
            </body>
        </html>
    );
}
