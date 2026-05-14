import Image from "next/image";

type Props = {
  className?: string;
  variant?: "dark" | "light";
};

export function Logo({ className, variant = "dark" }: Props) {
  if (variant === "light") {
    return (
      <span
        className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
        aria-label="HERVIA"
      >
        <span
          aria-hidden="true"
          className="relative grid place-items-center size-8 rounded-lg bg-gradient-to-br from-brand to-[var(--accent-cyan)] shadow-lg shadow-brand/40"
        >
          <span className="size-2 rounded-full bg-white" />
        </span>
        <span
          className="text-xl font-extrabold tracking-tight leading-none text-white"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          HERVIA
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      aria-label="HERVIA"
    >
      <Image
        src="/hervia-logo.png"
        alt="HERVIA"
        width={1073}
        height={387}
        priority
        unoptimized
        className="h-10 sm:h-11 w-auto"
      />
    </span>
  );
}
