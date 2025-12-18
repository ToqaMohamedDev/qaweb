import type { Metadata } from "next";
import { englishPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = englishPageMetadata;

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


