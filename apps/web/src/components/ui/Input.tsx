import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  if (label) {
    return (
      <div className="ds-field">
        <label htmlFor={id} className="ds-label">
          {label}
        </label>
        <input id={id} className={`ds-input ${className}`.trim()} {...props} />
      </div>
    );
  }

  return <input id={id} className={`ds-input ${className}`.trim()} {...props} />;
}
