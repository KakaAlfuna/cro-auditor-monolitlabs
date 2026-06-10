import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "./ui";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  variant?: "default" | "inline" | "hero";
}

export function UrlForm({ onSubmit, isLoading, variant = "default" }: UrlFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  const formClass =
    variant === "inline"
      ? "ds-audit-form ds-audit-form--inline"
      : variant === "hero"
        ? "ds-audit-form ds-audit-form--hero"
        : "ds-audit-form";

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <div className="ds-audit-form__input-wrap">
        <Search className="ds-audit-form__search-icon" size={18} strokeWidth={2} aria-hidden="true" />
        <input
          id="target-url"
          className="ds-input ds-audit-form__input"
          type="url"
          placeholder="https://yoursite.com/landing-page"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
          disabled={isLoading}
          aria-label="Website URL to audit"
        />
        <Button type="submit" disabled={isLoading || !url.trim()}>
          {isLoading ? "Running..." : "Run audit"}
        </Button>
      </div>
    </form>
  );
}
