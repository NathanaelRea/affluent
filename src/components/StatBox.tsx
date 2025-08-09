import React from "react";

type StatBoxProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
};

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  extra,
  className,
}) => {
  return (
    <div
      role="group"
      aria-label={typeof label === "string" ? label : undefined}
      className={`rounded-lg border p-3 bg-card/50 ${className ?? ""}`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">
        {value}
        {extra && (
          <span className="text-sm text-muted-foreground ml-2">{extra}</span>
        )}
      </div>
    </div>
  );
};

export default StatBox;
