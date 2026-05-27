import Image from "next/image";
import { cn } from "@/lib/utils";

interface AssistantAvatarProps {
  className?: string;
  size?: number;
}

export function AssistantAvatar({ className, size = 32 }: AssistantAvatarProps) {
  return (
    <Image
      src="/smartant-icon.png"
      alt="智蚁"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}
