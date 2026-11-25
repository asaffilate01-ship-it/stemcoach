import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { getMascot } from "@/lib/mascots";
import { chooseLocalVoice, listeningTracks, ListeningPlayback, type StudyLanguage } from "@/lib/listeningLab";
import { Ear, Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

const labels={
  en:{title:"Language laboratory",intro:"Listen to short phrases, repeat them aloud, then reveal the transcript and meaning.",select:"Study language",exercise:"Phrase",listen:"Listen",slow:"Listen slowly",stop:"Stop audio",reveal:"Show transcript",hide:"Hide transcript",meaning:"Meaning",repeat:"Repeat aloud at your own pace.",next:"Next phrase",previous:"Previous phrase",voice:"Device voice",noVoice:"No matching on-device voice is available. Reveal the transcript to practise reading, or install an appropriate device speech voice.",speechError:"Audio could not be played. Try again or reveal the transcript.",speaking:"Playing audio…",local:"Only device voices are used. No microphone, recordings, pronunciation scores or progress storage.",notice:"Illustrative practice phrases; not official exam material. Native-language review remains required. The tutor artwork is original; audio uses the device voice, not a recorded character voice."},
  de:{title:"Sprachlabor",intro:"Höre kurze Sätze, sprich sie nach und zeige anschließend Text und Bedeutung an.",select:"Lernsprache",exercise:"Satz",listen:"Anhören",slow:"Langsam anhören",stop:"Audio stoppen",reveal:"Text anzeigen",hide:"Text ausblenden",meaning:"Bedeutung",repeat:"Sprich in deinem eigenen Tempo nach.",next:"Nächster Satz",previous:"Vorheriger Satz",voice:"Gerätestimme",noVoice:"Keine passende lokale Stimme verfügbar. Zeige den Text zum Lesen an oder installiere eine passende Stimme auf deinem Gerät.",speechError:"Audio konnte nicht abgespielt werden. Versuche es erneut oder zeige den Text an.",speaking:"Audio wird abgespielt…",local:"Nur lokale Gerätestimmen. Kein Mikrofon, keine Aufzeichnungen, Aussprachebewertungen oder Speicherung von Lernfortschritten.",notice:"Beispielsätze, kein offizielles Prüfungsmaterial. Muttersprachliche Prüfung steht noch aus. Die Originalfigur bleibt erhalten; das Audio nutzt die Gerätestimme, keine aufgenommene Figurenstimme."}
};
type Copy=typeof labels.en;
type Track=typeof listeningTracks[number];

function PhrasePlayer({track,index,c,language}:{track:Track;index:number;c:Copy;language:"en"|"de"}){
  const phrase=track.phrases[index];
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [revealed,setRevealed]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [failed,setFailed]=useState(false);
  const playback=useRef(new ListeningPlayback()).current;
  const hasSpeech=typeof window!=="undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance==="function";
  const voice=chooseLocalVoice(voices,track.locale);

  useEffect(()=>{
    if(!hasSpeech)return;
    const engine=window.speechSynthesis;
    const refresh=()=>{try{setVoices(engine.getVoices());}catch{setVoices([]);}};
    refresh();
    engine.addEventListener("voiceschanged",refresh);
    return ()=>{engine.removeEventListener("voiceschanged",refresh);playback.stop();};
  },[hasSpeech,playback]);

  function play(rate:number){
    if(!hasSpeech)return;
    try {
      const engine=window.speechSynthesis;
      // Check again at the point of playback, not only when the page loads.
      const current=chooseLocalVoice(engine.getVoices(),track.locale);
      if(!current){setVoices([]);setFailed(true);return;}
      const utterance=new window.SpeechSynthesisUtterance(phrase.text);
      utterance.voice=current;
      utterance.lang=current.lang;
      utterance.rate=rate;
      setFailed(false);setSpeaking(true);
      playback.play(engine,utterance,error=>{setSpeaking(false);setFailed(error);});
    } catch {playback.stop();setSpeaking(false);setFailed(true);}
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!voice||speaking} className="min-h-11 gap-2" onClick={()=>play(1)}><Volume2 className="h-4 w-4" aria-hidden="true"/>{c.listen}</Button>
      <Button type="button" variant="outline" disabled={!voice||speaking} className="min-h-11 gap-2" onClick={()=>play(0.75)}>{c.slow}</Button>
      <Button type="button" variant="outline" disabled={!speaking} className="min-h-11 gap-2" onClick={()=>{playback.stop();setSpeaking(false);}}><VolumeX className="h-4 w-4" aria-hidden="true"/>{c.stop}</Button>
    </div>
    {voice?<p className="break-words text-xs text-muted-foreground">{c.voice}: {voice.name} ({voice.lang})</p>:<p role="status" className="rounded-xl border bg-muted/30 p-3 text-sm">{c.noVoice}</p>}
    {speaking&&<p role="status" className="text-sm text-muted-foreground">{c.speaking}</p>}
    {failed&&<p role="alert" className="text-sm text-destructive">{c.speechError}</p>}
    <Button type="button" variant="outline" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)} className="min-h-11 gap-2"><BookOpen className="h-4 w-4" aria-hidden="true"/>{revealed?c.hide:c.reveal}</Button>
    {revealed&&<div className="rounded-xl border bg-muted/20 p-4">
      <p lang={track.locale} dir={track.rtl?"rtl":"ltr"} className="break-words text-xl font-semibold leading-loose">{phrase.text}</p>
      <p className="mt-3 border-t pt-3 text-xs font-semibold text-muted-foreground">{c.meaning}</p>
      <p lang={language} className="mt-1 text-sm leading-relaxed">{language==="de"?phrase.meaningDe:phrase.meaningEn}</p>
      <p className="mt-3 text-xs text-muted-foreground">{c.repeat}</p>
    </div>}
  </div>;
}
export function LanguageLabWorkspace({language="en"}:{language?:"en"|"de"}){
  const c=labels[language];
  const [selected,setSelected]=useState<StudyLanguage>("en"),[index,setIndex]=useState(0);
  const track=listeningTracks.find(t=>t.id===selected)!;
  return <main id="main-content" className="container mx-auto max-w-5xl px-4 py-6 pb-28 sm:py-10">
    <header className="mb-5 flex items-start gap-3"><MascotAvatar mascot={getMascot(track.coach)} className="h-14 w-14 sm:h-20 sm:w-20"/><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.intro}</p></div></header>
    <div role="group" aria-label={c.select} className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{listeningTracks.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);setIndex(0);}} className={`min-h-14 min-w-0 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring ${selected===item.id?"border-primary bg-primary/5":"bg-card"}`}><span className="block font-semibold">{item.name}</span><span lang={item.locale} dir="auto" className="block break-words text-xs text-muted-foreground">{item.native}</span></button>)}</div>
    <section className="rounded-2xl border bg-card p-4 sm:p-6" aria-label={c.exercise}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Ear className="h-5 w-5 text-primary" aria-hidden="true"/>{track.name}</h2>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">{c.exercise} {index+1} / {track.phrases.length}</span>
      </div>
      <PhrasePlayer key={selected+":"+index} track={track} index={index} c={c} language={language}/>
      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t pt-4">
        <Button type="button" variant="outline" disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))} className="min-h-11 gap-1"><ChevronLeft className="h-4 w-4" aria-hidden="true"/>{c.previous}</Button>
        <Button type="button" disabled={index===track.phrases.length-1} onClick={()=>setIndex(i=>Math.min(track.phrases.length-1,i+1))} className="min-h-11 gap-1">{c.next}<ChevronRight className="h-4 w-4" aria-hidden="true"/></Button>
      </div>
    </section>
    <footer className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground"><p>{c.local}</p><p>{c.notice}</p></footer>
  </main>;
}
