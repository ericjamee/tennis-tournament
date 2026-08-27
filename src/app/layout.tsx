import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { EVENT_NAME } from "@/lib/tournament-details";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tennisprovo.com"), title: EVENT_NAME + " | Provo Tennis", description: "September 19 in Provo, Utah: a fast-format community singles tennis tournament. Registration is open for 16 players.", openGraph: { title: EVENT_NAME, description: "Fast matches. Competitive tennis. A great day on the courts.", type: "website", images: ["/opengraph-image"] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-scroll-behavior="smooth"><body><header className="site-header"><Link href="/" className="brand" aria-label="Provo Tennis home"><span>PT</span><b>PROVO<br/>TENNIS</b></Link><nav><Link href="/#format">Format</Link><Link href="/#bracket">Draw</Link><Link href="/#faq">FAQ</Link><Link href="/register" className="nav-cta">Register</Link></nav></header>{children}<footer><div className="brand brand-light"><span>PT</span><b>PROVO<br/>TENNIS</b></div><p>Community tennis, made for Provo.</p><Link href="/admin">Organizer login</Link></footer><Analytics /></body></html>; }
