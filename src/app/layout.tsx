import type {Metadata} from "next";
import {Space_Grotesk} from "next/font/google";
import "./globals.css";
import {Providers} from "@/lib/providers";
import {Toaster} from "sonner";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
    title: "TxRay",
    description: "Drift Pass Collection",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${spaceGrotesk.variable} font-sans`}>
        <Providers>
            {children}
        </Providers>
        <Toaster
            position="bottom-right"
            expand={true}
            richColors={false}
            closeButton={true}
            toastOptions={{
                style: {
                    background: '#F3F3F3',
                    color: '#191A23',
                    border: '1px solid #191A23',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 0 0 rgba(0,0,0,1), 0 10px 15px -3px rgb(0 0 0 / 0.1)',
                },
                className: 'toast-custom',
            }}
        />
        </body>
        </html>
    );
}
