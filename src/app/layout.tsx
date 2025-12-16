// Root layout component
// This wraps all pages and provides global styling and metadata

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "AI Translation App - GT Take Home Assignment",
    description: "A sophisticated translation app using OpenAI and Anthropic models for text and JSON translation",
    keywords: ["translation", "AI", "OpenAI", "Anthropic", "Next.js", "TypeScript"],
    authors: [{ name: "GT Assignment" }],
    viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
        </body>
        </html>
    );
}