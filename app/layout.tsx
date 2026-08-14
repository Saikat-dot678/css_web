import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import "./v4-home.css";
import "./v4-pages.css";
import "../styles/home/sections.css";
import "../responsive-enhancements.css";
import "../responsive-pages.css";
import "../styles/home/motion.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "CSS — NIT Durgapur", template: "%s — CSS NIT Durgapur" },
  description:
    "The CSE Students’ Society of the National Institute of Technology Durgapur.",
  openGraph: {
    title: "CSS — NIT Durgapur",
    description: "Events, projects, resources, people, and the department record.",
    type: "website",
  },  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={robotoMono.variable} data-scroll-behavior="auto">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
