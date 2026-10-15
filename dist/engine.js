export const WARNING = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';
export const FIELDS = [['brand','Brand name'],['type','Class / type'],['abv','Alcohol content'],['net','Net contents'],['producer','Producer / bottler'],['address','Producer address'],['origin','Country of origin']];
export const SAMPLE = {filename:'old-tom.png',brand:'OLD TOM DISTILLERY',type:'Kentucky Straight Bourbon Whiskey',abv:'45',net:'750 mL',producer:'Old Tom Distillery',address:'Louisville, Kentucky',origin:'',imported:false};
export const normalize = s => String(s ?? '').normalize('NFKC').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const words = s => normalize(s).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokenMatch = (text,value) => (' '+words(text)+' ').includes(' '+words(value)+' ');
export function parseABV(text) { return [...text.matchAll(/\b(\d{1,2}(?:\.\d+)?)\s*%\s*(?:alc(?:ohol)?\.?\s*(?:\/\s*vol\.?)?|abv)?/gi)].map(m=>Number(m[1])); }
export function volumes(text) { return [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(millilit(?:er|re)s?|ml|lit(?:er|re)s?|l|fl\.?\s*oz\.?)\b/gi)].map(m=>Number(m[1])*(/^l/i.test(m[2])?1000:/^fl/i.test(m[2])?29.5735295625:1)); }
export function validateApplication(a) {
  const errors=[];
  for (const k of ['brand','type','net','producer','address']) if (!String(a[k]??'').trim()) errors.push(`${FIELDS.find(f=>f[0]===k)[1]} is required.`);
  if (a.abv!=='' && a.abv!=null && (!/^\d+(\.\d+)?$/.test(String(a.abv)) || Number(a.abv)<0 || Number(a.abv)>100)) errors.push('Alcohol content must be a number from 0 to 100.');
  if (!volumes(a.net??'').length) errors.push('Use a net contents value with a unit, such as 750 mL or 1 L.');
  if (a.imported && !String(a.origin??'').trim()) errors.push('Country of origin is required for an imported product.');
  return errors;
}
export function compare(text, a, confidence=100) {
  const rows=FIELDS.map(([key,label])=>{
    const expected=String(a[key]??'').trim();
    if (key==='origin' && !a.imported && !expected) return {key,label,expected:'Domestic product',status:'skip',detail:'Origin comparison not requested.'};
    if (key==='abv' && !expected) return {key,label,expected:'Not supplied',status:'review',detail:'Check whether alcohol content is required for this beverage.'};
    let match=false, observed='Not found in recognized text';
    if(key==='abv') { const n=parseABV(text); match=n.includes(Number(expected)); observed=n.length?n.map(v=>`${v}%`).join(', '):observed; }
    else if(key==='net') { const n=volumes(text), e=volumes(expected)[0]; match=n.some(v=>Math.abs(v-e)<0.6); observed=n.length?n.map(v=>`${Math.round(v*100)/100} mL`).join(', '):observed; }
    else {match=!!expected && tokenMatch(text,expected); observed=match?expected:observed;}
    return {key,label,expected:key==='abv'?expected+'%':expected,observed,status:match?'match':'review',detail:match?'Found in recognized label text.':'Possible mismatch or OCR omission. Compare the original image.'};
  });
  const flat=text.replace(/\s+/g,' ').trim(), found=flat.match(/government warning\s*:/i), start=found?.index ?? -1;
  const warningText=start<0?'':flat.slice(start,start+WARNING.length);
  const exact=normalize(warningText)===normalize(WARNING);
  rows.push({key:'warning',label:'Warning wording & punctuation',expected:WARNING,observed:warningText||'No government warning detected',status:exact?'match':'review',detail:exact?'Text matches after whitespace and case normalization.':'Warning is missing, differs, or was not read accurately.'});
  const caps=flat.includes('GOVERNMENT WARNING:');
  rows.push({key:'caps',label:'Warning heading capitalization',expected:'GOVERNMENT WARNING:',observed:found?.[0]||'Not detected',status:caps?'match':'review',detail:caps?'All-capital heading detected.':'All-capital heading was not detected.'});
  rows.push({key:'format',label:'Warning typography & legibility',expected:'Bold heading, regular body, required type size, contrast and separation',status:'manual',detail:'Visual review required. OCR cannot establish font weight or physical print size.'});
  if(confidence<80) rows.push({key:'confidence',label:'Image reading quality',status:'review',expected:'Clear, readable artwork',observed:`${Math.round(confidence)}% OCR confidence`,detail:'Low confidence. Use a sharper image and verify all recognized text.'});
  return {rows,needsReview:rows.filter(r=>r.status==='review').length,matched:rows.filter(r=>r.status==='match').length,confidence};
}
