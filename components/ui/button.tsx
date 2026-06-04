import Link from "next/link";

type Variant = "primary" | "buy" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  buy: "bg-amber-500 text-slate-900 hover:bg-amber-600 font-semibold",
  ghost: "border border-slate-300 text-slate-700 hover:bg-slate-50",
};

const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}
