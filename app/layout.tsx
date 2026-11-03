import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TaskFlow — Premium To-Do App",
  description:
    "A beautiful, free, and persistent to-do app. Organize your tasks with elegance. No login required — your tasks are saved automatically.",
  keywords: ["todo", "task manager", "productivity", "free", "online"],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "TaskFlow — Premium To-Do App",
    description: "A beautiful, free to-do app that saves your tasks automatically.",
    type: "website",
    images: [{ url: "/logo.jpg", width: 1024, height: 1024, alt: "TaskFlow Logo" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
