import type { LabelledDiagram } from "@/data/tutorials";

interface Props { diagram: LabelledDiagram; description: string; }

/** Original inline SVG diagrams. Labels are entered using accessible HTML selectors below. */
export function DiagramCanvas({ diagram, description }: Props) {
  return (
    <svg role="img" aria-label={description} viewBox="0 0 400 220"
      className="w-full max-w-xl rounded-xl border bg-background p-2">
      <rect x="0" y="0" width="400" height="220" rx="12" fill="currentColor" fillOpacity="0.025" />
      {diagram.kind === "right-triangle" && (
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M78 28 L78 174 L326 174 Z" />
          <path d="M78 151 L101 151 L101 174" strokeWidth="2" />
          <path d="M304 174 Q310 166 304 160" strokeWidth="1.5" />
          <text x="288" y="155" fill="currentColor" stroke="none" fontSize="15">θ</text>
        </g>
      )}
      {diagram.kind === "cell" && (
        <g stroke="currentColor" strokeWidth="2">
          <ellipse cx="198" cy="113" rx="166" ry="89" fill="currentColor" fillOpacity="0.06" />
          <ellipse cx="185" cy="111" rx="55" ry="45" fill="currentColor" fillOpacity="0.16" />
          <circle cx="196" cy="113" r="14" fill="currentColor" fillOpacity="0.3" />
          <g fill="none" strokeWidth="2">
            <path d="M76 83 Q95 62 114 88" /><path d="M273 143 Q293 161 309 143" />
            <path d="M102 135 q12 -15 23 0 q-12 18 -23 0" />
            <path d="M265 77 q12 -15 24 0 q-10 18 -24 0" />
          </g>
        </g>
      )}
      {diagram.kind === "water-cycle" && (
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M20 186 L380 186" /><path d="M220 186 L304 106 L385 186" />
          <path d="M18 173 Q87 160 160 175 Q195 185 222 175" />
          <path d="M76 147 Q65 117 80 96 L73 107 M80 96 L89 111" />
          <path d="M233 84 L247 134 M247 134 L237 123 M247 134 L254 120" />
          <path d="M268 81 L281 126 M281 126 L272 115 M281 126 L288 112" />
          <path d="M98 66 Q85 42 110 32 Q117 13 143 28 Q167 13 180 40 Q202 44 195 64 Z" fill="currentColor" fillOpacity="0.09" />
          <circle cx="348" cy="36" r="21" fill="currentColor" fillOpacity="0.1" />
        </g>
      )}
      {diagram.kind === "circuit" && (
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M68 46 L160 46 M260 46 L333 46 L333 176 L68 176 L68 106" />
          <rect x="160" y="35" width="100" height="22" rx="2" fill="currentColor" fillOpacity="0.12" />
          <path d="M68 46 L68 82 M68 92 L68 106" />
          <path d="M48 82 L88 82 M57 92 L79 92" />
          <path d="M283 46 l0 -13 m-7 6 l14 0" strokeWidth="1.5" />
        </g>
      )}
      {diagram.markers.map((marker) => (
        <g key={marker.id} aria-hidden="true">
          <circle cx={marker.x} cy={marker.y} r="13" fill="#1d4ed8" stroke="white" strokeWidth="2" />
          <text x={marker.x} y={marker.y + 5} textAnchor="middle" fontSize="14"
            fontWeight="bold" fill="white">{marker.id}</text>
        </g>
      ))}
    </svg>
  );
}
