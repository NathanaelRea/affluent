import { ReactNode } from "react";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "./ui/tooltip.tsx";
import { CircleHelpIcon } from "lucide-react";

export function TooltipHelp({
  children,
  text,
}: {
  children: ReactNode;
  text: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger>
          <div className="flex gap-1 items-center">
            {children}
            <CircleHelpIcon className="h-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-full max-w-[90vw] md:max-w-md">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
