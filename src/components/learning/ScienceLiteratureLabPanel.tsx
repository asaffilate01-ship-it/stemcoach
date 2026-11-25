import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Control, Metric, ModelFrame } from "./LabPrimitives";
import { buoyancyModel, thermalEnergyModel, materialHeatCapacity, type HeatMaterial } from "@/lib/scienceLabs";
import { readingPassages } from "@/lib/closeReading";
import { scienceLabLabels } from "./scienceLabLabels";

const copy={
 en:{reset:"Reset model",inputs:"Model controls",results:"Calculated results",experiment:"Predict, explore, explain",mass:"Object mass",volume:"Object volume",density:"Object density",displaced:"Displaced water",submerged:"Volume submerged",weight:"Weight",force:"Buoyant force",floats:"Floats at equilibrium",neutral:"Neutral buoyancy when immersed",sinks:"Sinks when fully immersed",buoyTip:"Keep mass fixed and increase volume. Explain why a lower average density can lead to flotation.",buoyLimit:"Ideal uniform object in water, density 1 g/cm³, g = 9.81 m/s². No surface tension, trapped air or container boundaries. For sinking objects, results describe full immersion, not contact with the bottom.",material:"Material",water:"Water",aluminium:"Aluminium",iron:"Iron",rise:"Temperature increase",heat:"Energy transferred",capacity:"Specific heat capacity",heatTip:"Compare water and iron with the same mass and temperature rise. Explain why the energy required differs.",heatLimit:"Approximate constant heat capacities, no heat loss or change of state. An illustrative model, not instructions to heat materials.",passage:"Choose passage",evidence:"Explore textual evidence",reveal:"Reveal commentary",hide:"Hide commentary",notes:"Interpretation is illustrative. Explain the link between a quotation, technique and possible effect; alternative evidence-based readings may also be valid.",english:"Passages are in English. Commentary follows the interface language."},
 de:{reset:"Modell zurücksetzen",inputs:"Modellparameter",results:"Berechnete Ergebnisse",experiment:"Vorhersagen, untersuchen, erklären",mass:"Masse des Körpers",volume:"Volumen des Körpers",density:"Dichte des Körpers",displaced:"Verdrängtes Wasser",submerged:"Eingetauchter Volumenanteil",weight:"Gewichtskraft",force:"Auftriebskraft",floats:"Schwimmt im Gleichgewicht",neutral:"Neutraler Auftrieb bei vollständigem Eintauchen",sinks:"Sinkt bei vollständigem Eintauchen",buoyTip:"Halte die Masse konstant und vergrößere das Volumen. Erkläre, warum eine geringere Dichte zum Schwimmen führen kann.",buoyLimit:"Idealer homogener Körper in Wasser, Dichte 1 g/cm³, g = 9,81 m/s². Keine Oberflächenspannung, eingeschlossene Luft oder Gefäßgrenzen. Für sinkende Körper gilt vollständiges Eintauchen ohne Bodenkontakt.",material:"Material",water:"Wasser",aluminium:"Aluminium",iron:"Eisen",rise:"Temperaturerhöhung",heat:"Übertragene Energie",capacity:"Spezifische Wärmekapazität",heatTip:"Vergleiche Wasser und Eisen bei gleicher Masse und Temperaturerhöhung. Erkläre den unterschiedlichen Energiebedarf.",heatLimit:"Näherungsweise konstante Wärmekapazitäten, keine Wärmeverluste oder Phasenübergänge. Keine praktische Heiz- oder Versuchsanleitung.",passage:"Text auswählen",evidence:"Textbelege untersuchen",reveal:"Kommentar anzeigen",hide:"Kommentar ausblenden",notes:"Die Deutung ist beispielhaft. Erkläre den Zusammenhang zwischen Zitat, Stilmittel und möglicher Wirkung. Andere textgestützte Deutungen können ebenfalls gültig sein.",english:"Die Texte sind auf Englisch. Die Kommentare folgen der Oberflächensprache."}
};
type Props={c:typeof copy.en;locale:string;title:string};
function Buoyancy({c,locale,title}:Props){
 const [mass,M]=useState(600),[volume,V]=useState(1000),m=buoyancyModel(mass,volume);
 return <ModelFrame c={c} title={title} reset={()=>{M(600);V(1000);}} formula="ρ = m / V; Fᵦ = ρwater × g × displaced volume (SI units)"
 inputs={<><Control label={c.mass} value={mass} min={50} max={2000} step={50} unit="g" change={M} locale={locale}/><Control label={c.volume} value={volume} min={100} max={2000} step={100} unit="cm³" change={V} locale={locale}/></>}
 results={<><dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.density} value={m.density} unit="g/cm³" locale={locale}/><Metric label={c.displaced} value={m.displacedCm3} unit="cm³" locale={locale}/><Metric label={c.submerged} value={m.submergedPercent} unit="%" locale={locale}/><Metric label={c.weight} value={m.weight} unit="N" locale={locale}/><Metric label={c.force} value={m.buoyantForce} unit="N" locale={locale}/></dl><p role="status" className="rounded-xl border bg-muted/20 p-3 text-sm font-semibold">{c[m.state as "floats"|"neutral"|"sinks"]}</p></>}
 tip={c.buoyTip} limit={c.buoyLimit}/>;
}
function Thermal({c,locale,title}:Props){
 const [material,T]=useState<HeatMaterial>("water"),[mass,M]=useState(1000),[rise,R]=useState(10),m=thermalEnergyModel(material,mass,rise);
 return <ModelFrame c={c} title={title} reset={()=>{T("water");M(1000);R(10);}} formula="Q = mcΔT; mass in kg"
 inputs={<><label className="block rounded-xl border bg-background p-3 text-sm font-medium">{c.material}<select aria-label={c.material} value={material} onChange={e=>T(e.target.value as HeatMaterial)} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{(Object.keys(materialHeatCapacity) as HeatMaterial[]).map(key=><option key={key} value={key}>{c[key]}</option>)}</select></label><Control label={c.mass} value={mass} min={100} max={2000} step={100} unit="g" change={M} locale={locale}/><Control label={c.rise} value={rise} min={0} max={40} unit="°C" change={R} locale={locale}/></>}
 results={<dl className="grid gap-2 sm:grid-cols-2" aria-live="polite"><Metric label={c.capacity} value={m.specificHeat} unit="J/(kg·K)" locale={locale}/><Metric label={c.heat} value={m.energyKJ} unit="kJ" locale={locale}/></dl>}
 tip={c.heatTip} limit={c.heatLimit}/>;
}
function CloseReading({c,title,language}:Props&{language:"en"|"de"}){
 const [index,I]=useState(0),[selected,S]=useState<number|null>(null);
 const passage=readingPassages[index],observation=selected===null?null:passage.observations[selected];
 return <section aria-label={title} className="rounded-2xl border bg-card p-4 sm:p-6">
 <h2 className="mb-3 text-xl font-semibold">{title}</h2><p className="mb-4 text-sm text-muted-foreground">{c.english}</p>
 <label className="block text-sm font-medium">{c.passage}<select aria-label={c.passage} value={index} onChange={e=>{I(Number(e.target.value));S(null);}} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring">{readingPassages.map((p,i)=><option key={p.id} value={i} lang="en">{p.title}</option>)}</select></label>
 <blockquote lang="en" className="my-4 rounded-xl border-l-4 border-primary bg-muted/20 p-4 text-lg leading-relaxed">{passage.text}</blockquote>
 <h3 className="mb-2 text-sm font-semibold">{c.evidence}</h3>
 <div className="grid gap-2">{passage.observations.map((o,i)=><Button key={o.quote} type="button" variant="outline" aria-expanded={selected===i} onClick={()=>S(selected===i?null:i)} className="h-auto min-h-11 justify-start whitespace-normal text-left"><span lang="en" className="break-words">“{o.quote}”</span><span className="ml-auto text-xs text-muted-foreground">{selected===i?c.hide:c.reveal}</span></Button>)}</div>
 {observation&&<div aria-live="polite" className="mt-3 rounded-xl border p-4"><h4 className="font-semibold">{language==="de"?observation.deviceDe:observation.device}</h4><p className="mt-2 text-sm leading-relaxed">{language==="de"?observation.explanationDe:observation.explanation}</p></div>}
 <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.notes}</p>
 </section>;
}
export function ScienceLiteratureLabPanel({lab,language}:{lab:"buoyancy"|"thermalEnergy"|"closeReading";language:"en"|"de"}){
 const props={c:copy[language],locale:language==="de"?"de-DE":"en-GB",title:scienceLabLabels[language][lab]};
 return lab==="buoyancy"?<Buoyancy {...props}/>:lab==="thermalEnergy"?<Thermal {...props}/>:<CloseReading {...props} language={language}/>;
}
