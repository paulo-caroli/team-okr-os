import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/app/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Team OKR OS",
  description: "The operational discipline layer for measurable results.",
  metadataBase: new URL("https://teamokr.caroli.org"),
  openGraph: {
    title: "Team OKR OS",
    description: "The operational discipline layer for measurable results.",
    url: "https://teamokr.caroli.org",
    siteName: "Team OKR OS",
    images: [
      {
        url: "/team-okr-os-og.png",
        width: 1200,
        height: 630,
        alt: "Team OKR OS",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Team OKR OS",
    description: "The operational discipline layer for measurable results.",
    images: ["/team-okr-os-og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
