import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Desandhiri",
  description: "Find places for a destination, then a day-wise route grouped by geography.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
