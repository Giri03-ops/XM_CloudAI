import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NavHeader } from "@/components/nav-header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "XM Cloud Certification Topics",
  description: "Select topics from the XM Cloud Syllabus and get detailed information",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavHeader />
        {children}
      </body>
    </html>
  )
}

