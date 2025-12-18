import type { Metadata } from "next";
import { signupPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = signupPageMetadata;

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


