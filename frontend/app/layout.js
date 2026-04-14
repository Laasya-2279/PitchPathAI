import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import DebugPanel from "@/components/DebugPanel";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PitchPath AI — Smart Stadium Navigation",
  description: "AR-powered navigation, voice AI assistant, and real-time crowd analytics for smart stadium experiences. Built for 132,000-capacity venues.",
  keywords: "stadium navigation, AR, voice assistant, crowd analytics, smart venue",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0b0f1a" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
        <DebugPanel />
      </body>
    </html>
  );
}
