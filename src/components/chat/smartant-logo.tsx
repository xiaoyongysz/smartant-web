import Image from "next/image";
import { cn } from "@/lib/utils";

interface SmartantLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: 24, text: "text-base" },
  md: { img: 32, text: "text-lg" },
  lg: { img: 80, text: "text-2xl" },
};

export function SmartantLogo({
  size = "md",
  showText = true,
  className,
}: SmartantLogoProps) {
  const { img, text } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/smartant-mascot.png"
        alt="smartant"
        width={img}
        height={img}
        className="shrink-0 rounded-full object-cover"
        priority={size === "lg"}
      />
      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            text,
          )}
        >
          smartant
        </span>
      )}
    </div>
  );
}
