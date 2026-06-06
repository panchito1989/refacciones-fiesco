import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false },
};

export default function IngresarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
