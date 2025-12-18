import type { Metadata } from "next";
import { arabicPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = arabicPageMetadata;

export default function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


