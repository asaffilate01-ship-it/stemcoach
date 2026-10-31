import { useTranslation } from "react-i18next";
import type { TutorialCheckpoint } from "@/data/tutorials";
export function GraphPointInput({ graph: g, value, onChange, disabled, id }: {
  graph: NonNullable<TutorialCheckpoint["graph"]>; value: Record<string,string>;
  onChange: (point: Record<string,string>) => void; disabled: boolean; id: string;
}) {
  const { t } = useTranslation();
  const px = (x: number) => 30 + (x-g.xMin)/(g.xMax-g.xMin)*300;
  const py = (y: number) => 230 - (y-g.yMin)/(g.yMax-g.yMin)*200;
  const x = Number(value.x), y = Number(value.y);
  const valid = !!value.x?.trim() && !!value.y?.trim() && Number.isFinite(x) && Number.isFinite(y) && x>=g.xMin && x<=g.xMax && y>=g.yMin && y<=g.yMax;
  return <div className="space-y-3">
    <p id={id+"-instructions"} className="text-sm text-muted-foreground">{t("qa.graphInstructions")}</p>
    <svg viewBox="0 0 360 260" className="w-full max-w-md rounded-xl border bg-background" role="img" aria-label={t("qa.graphTitle")}
      onClick={event => { if (disabled) return; const svg=event.currentTarget; const matrix=svg.getScreenCTM(); if (!matrix) return; const point=svg.createSVGPoint(); point.x=event.clientX; point.y=event.clientY; const local=point.matrixTransform(matrix.inverse()); if(local.x<30||local.x>330||local.y<30||local.y>230)return;
        onChange({ x:String(Math.round(g.xMin+(local.x-30)/300*(g.xMax-g.xMin))), y:String(Math.round(g.yMin+(230-local.y)/200*(g.yMax-g.yMin))) }); }}>
      <rect x="30" y="30" width="300" height="200" fill="none" stroke="currentColor" opacity=".25" />
      {g.yMin<=0 && g.yMax>=0 && <line x1="30" y1={py(0)} x2="330" y2={py(0)} stroke="currentColor" />}
      {g.xMin<=0 && g.xMax>=0 && <line x1={px(0)} y1="30" x2={px(0)} y2="230" stroke="currentColor" />}
      <text x="30" y="250" fill="currentColor">{g.xMin}</text><text x="310" y="250" fill="currentColor">{g.xMax} x</text>
      <text x="5" y="35" fill="currentColor">{g.yMax}</text><text x="5" y="230" fill="currentColor">{g.yMin}</text>
      {valid && <><circle cx={px(x)} cy={py(y)} r="6" fill="currentColor" /><text x={px(x)+8} y={py(y)-8} fill="currentColor">({x}, {y})</text></>}
    </svg>
    <div className="grid grid-cols-2 gap-3">{["x","y"].map(axis=><label key={axis} className="text-sm font-medium" htmlFor={id+axis}>{axis.toUpperCase()}
      <input className="mt-1 w-full rounded-lg border bg-background p-3" id={id+axis} type="number" step="any" disabled={disabled} aria-describedby={id+"-instructions"} value={value[axis]||""}
        onChange={event=>onChange({...value,[axis]:event.target.value})} />
    </label>)}</div>
  </div>;
}
