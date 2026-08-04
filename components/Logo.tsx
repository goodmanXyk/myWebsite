import Link from "next/link";
import { SITE } from "@/lib/theme";

export function Logo({
  href = "/",
  showText = true,
}: {
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M13 2 L4 14 h7 l-2 8 9-12 h-7 z" />
        </svg>
      </span>
      {showText && (
        <span className="text-base font-semibold tracking-tight text-ink">
          {SITE.name}
        </span>
      )}
    </Link>
  );
}
