import { Panel } from "./ui";

interface ColorWarningProps {
  totalColors: number;
  colors: string[];
  hasWarning: boolean;
}

export function ColorWarning({ totalColors, colors, hasWarning }: ColorWarningProps) {
  if (!hasWarning) {
    return (
      <Panel variant="success">
        <p className="ds-section__title" style={{ margin: 0 }}>
          Brand palette
        </p>
        <p className="ds-text ds-text--muted ds-text--sm" style={{ marginTop: "var(--space-2)" }}>
          {totalColors} colors detected — within the 3-color limit.
        </p>
        <ColorSwatches colors={colors} />
      </Panel>
    );
  }

  return (
    <Panel variant="warning" role="alert">
      <p className="ds-section__title" style={{ margin: 0 }}>
        Cluttered palette
      </p>
      <p className="ds-text ds-text--muted ds-text--sm" style={{ marginTop: "var(--space-2)" }}>
        {totalColors} colors detected (max 3). Too many colors weaken hierarchy and brand
        recognition.
      </p>
      <ColorSwatches colors={colors} />
    </Panel>
  );
}

function ColorSwatches({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null;

  return (
    <ul className="ds-swatches" aria-label="Detected colors">
      {colors.map((color) => (
        <li key={color} title={color}>
          <span className="ds-swatch" style={{ backgroundColor: color }} />
          <code>{color}</code>
        </li>
      ))}
    </ul>
  );
}
