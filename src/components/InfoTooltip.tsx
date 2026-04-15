import type { ComponentProps } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  className?: string;
  side?: ComponentProps<typeof TooltipContent>["side"];
  align?: ComponentProps<typeof TooltipContent>["align"];
  sideOffset?: ComponentProps<typeof TooltipContent>["sideOffset"];
}

export function InfoTooltip({
  content,
  className,
  side = "right",
  align = "center",
  sideOffset = 8,
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex" tabIndex={-1}>
            <Info className={`h-3 w-3 text-muted-foreground ${className || ""}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} sideOffset={sideOffset}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
