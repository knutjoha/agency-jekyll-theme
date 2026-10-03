import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@cognite/aura/styles.css";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Familien Vidvei",
  description: "Family Hub",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
