export function parseCatalog(text) {
  if(typeof text!=='string'||text.length>120000)throw new Error('Paste a plain-text catalog under 120,000 characters.');
  const rows=text.split(/\r?\n/).map((line,i)=>({line:line.trim(),at:i+1})).filter(x=>x.line);
  if(rows.length<2) throw new Error('Enter at least two listings.');
  if(rows.length>100) throw new Error('Split this catalog into batches of at most 100 listings to keep browser inference responsive.');
  const ids=new Set();
  return rows.map(({line,at})=>{
    const p=line.split('|');
    if(p.length!==3||!p[0].trim()||!p[1].trim()) throw new Error(`Line ${at}: use id|title|description, with no extra pipe characters.`);
    const [id,title,desc]=p.map(x=>x.trim());
    if(ids.has(id))throw new Error(`Line ${at}: listing IDs must be unique.`);
    if(id.length>60||title.length>200||desc.length>700)throw new Error(`Line ${at}: shorten the ID, title or description (60/200/700 characters).`);
    ids.add(id);return {id,title,desc};
  });
}
const stop=new Set('the a an and or of in on for with to is are was were be by as at from it its this that these those'.split(' '));
export const normalized=s=>s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export const tokens=s=>new Set(normalized(s).split(' ').filter(w=>w.length>2&&!stop.has(w)));
export const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function comparePairs(items,vectors,threshold) {
  if(!Number.isFinite(threshold)||threshold<0||threshold>1)throw new Error('Invalid similarity threshold.');
  if(!Array.isArray(vectors)||vectors.length!==items.length)throw new Error('The model returned an unexpected number of vectors.');
  const width=vectors[0]?.length;
  if(!width||!vectors.every(v=>Array.isArray(v)&&v.length===width&&v.every(Number.isFinite)))throw new Error('The model returned invalid vectors.');
  const pairs=[];
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const va=vectors[i],vb=vectors[j];
    const na=Math.hypot(...va),nb=Math.hypot(...vb);
    if(!na||!nb)throw new Error('The model returned an empty vector.');
    const score=Math.max(-1,Math.min(1,va.reduce((n,x,k)=>n+x*vb[k],0)/(na*nb)));
    if(score<threshold)continue;
    const a=items[i],b=items[j],ta=tokens(a.title+' '+a.desc),tb=tokens(b.title+' '+b.desc);
    const shared=[...ta].filter(w=>tb.has(w));
    const union=new Set([...ta,...tb]);
    pairs.push({a,b,score,words:shared.slice(0,12),lexical:union.size?shared.length/union.size:0,identical:normalized(a.title+' '+a.desc)===normalized(b.title+' '+b.desc)});
  }
  return pairs.sort((a,b)=>b.score-a.score);
}
