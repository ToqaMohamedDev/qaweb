import type { Metadata } from "next";
import { loginPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = loginPageMetadata;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


