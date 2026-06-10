import { CircleHelp } from "lucide-react";
import { useId } from "react";

interface TooltipProps {
  content: string;
  label?: string;
  placement?: "top" | "bottom";
  align?: "start" | "center" | "end";
}

export function Tooltip({
  content,
  label = "More info",
  placement = "bottom",
  align = "start",
}: TooltipProps) {
  const tooltipId = useId();
  const className = [
    "ds-tooltip",
    placement === "top" ? "ds-tooltip--top" : "ds-tooltip--bottom",
    `ds-tooltip--align-${align}`,
  ].join(" ");

  return (
    <span className={className}>
      <button
        type="button"
        className="ds-tooltip__trigger"
        aria-describedby={tooltipId}
        aria-label={label}
      >
        <CircleHelp size={12} strokeWidth={2} aria-hidden="true" />
      </button>
      <span id={tooltipId} role="tooltip" className="ds-tooltip__content">
        {content}
      </span>
    </span>
  );
}
