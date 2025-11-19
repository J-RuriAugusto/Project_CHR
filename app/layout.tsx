import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "Supabase Next Auth",
  description: "",
};

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "900"],
  variable: "--font-source-sans-3",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sourceSans.variable}>
      <body className="font-sans bg-background text-foreground">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
