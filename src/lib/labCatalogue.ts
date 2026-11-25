/** A fixed catalogue, not a dynamic code loader. Query strings select only known simulations. */
export const LAB_CATALOGUE = [
  {id:"circuit",subject:"physics",group:"science",keywords:"electric circuits voltage resistance electricity spannung widerstand"},
  {id:"motion",subject:"physics",group:"science",keywords:"motion velocity acceleration displacement geschwindigkeit beschleunigung"},
  {id:"dilution",subject:"chemistry",group:"science",keywords:"dilution concentration volume verdünnung konzentration"},
  {id:"quadratic",subject:"mathematics",group:"maths",keywords:"quadratic graph roots vertex parabola nullstellen scheitelpunkt"},
  {id:"inheritance",subject:"biology",group:"science",keywords:"genetics mendelian inheritance punnett square allele genotyp vererbung"},
  {id:"binarySearch",subject:"computer-science",group:"technology",keywords:"binary search algorithm coding array binäre suche"},
  {id:"statistics",subject:"mathematics",group:"maths",keywords:"statistics mean median standard deviation outlier mittelwert median ausreißer"},
  {id:"classifier",subject:"computer-science",group:"technology",keywords:"AI artificial intelligence classification threshold precision recall confusion matrix KI künstliche intelligenz"},
  {id:"breakEven",subject:"business-studies",group:"business",keywords:"break even contribution profit cost accounting gewinnschwelle deckungsbeitrag"},
  {id:"subnet",subject:"computer-science",group:"technology",keywords:"networking IPv4 subnet capacity host netzwerk subnetz"},
  {id:"cloudCapacity",subject:"computer-science",group:"technology",keywords:"cloud resilience instance failure capacity redundancy ausfallsicherheit"},
  {id:"policy",subject:"computer-science",group:"technology",keywords:"cyber security defensive access control least privilege authentication RLS zugriffskontrolle"},
  {id:"cashAccrual",subject:"business-studies",group:"business",keywords:"accounting cash flow accrual profit receivables depreciation buchhaltung abschreibung"},
  {id:"marketEquilibrium",subject:"economics",group:"business",keywords:"economics supply demand equilibrium market shortage surplus angebot nachfrage"},
] as const;

export type LabId=typeof LAB_CATALOGUE[number]["id"];
export type LabGroup="all"|typeof LAB_CATALOGUE[number]["group"];
export const LAB_GROUPS:readonly LabGroup[]=["all","science","maths","technology","business"];
const knownIds=new Set<string>(LAB_CATALOGUE.map(lab=>lab.id));
export function parseLabSelection(value:unknown):LabId{
  return typeof value==="string"&&knownIds.has(value)?value as LabId:"circuit";
}

export type CatalogueEntry={id:LabId;group:Exclude<LabGroup,"all">;title:string;subjectLabel:string;keywords:string};
const normalise=(value:string)=>value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase().replace(/ß/g,"ss").replace(/[^\p{L}\p{N}]+/gu," ").trim();

export function filterLabCatalogue<T extends CatalogueEntry>(entries:readonly T[],group:LabGroup,query:string):T[]{
  const terms=normalise(query.slice(0,160)).split(/\s+/).filter(Boolean);
  return entries.filter(entry=>{
    if(group!=="all"&&entry.group!==group)return false;
    const searchable=normalise(entry.title+" "+entry.subjectLabel+" "+entry.keywords);
    return terms.every(term=>searchable.includes(term));
  });
}
