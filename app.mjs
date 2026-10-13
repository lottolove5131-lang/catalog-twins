import {parseCatalog,comparePairs,escapeHtml} from './core.mjs';
const input=document.getElementById('input'),go=document.getElementById('go'),reset=document.getElementById('reset'),status=document.getElementById('status'),results=document.getElementById('results'),threshold=document.getElementById('threshold');
const sample=input.value;
let extractor=null;
let modelPromise=null;
const tell=(message,cls='')=>{status.textContent=message;status.className=cls;};
async function ensureModel(){
  if(extractor)return extractor;
  if(!modelPromise)modelPromise=(async()=>{
    const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels=false;
    env.backends.onnx.wasm.numThreads=1;
    return pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{revision:'751bff37182d3f1213fa05d7196b954e230abad9',dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress'&&Number.isFinite(p.progress))tell(`Downloading model assets: ${Math.round(p.progress)}%. Your listings stay in this browser.`,'loading');}});
  })().then(x=>{extractor=x;return x;}).catch(e=>{modelPromise=null;throw e;});
  return modelPromise;
}
reset.addEventListener('click',()=>{input.value=sample;results.replaceChildren();tell('Sample restored. No customer records are included.');});
go.addEventListener('click',async()=>{
  if(go.disabled)return;
  results.replaceChildren();
  let items;
  try{items=parseCatalog(input.value);}catch(e){tell(e.message,'error');return;}
  const cutoff=Number(threshold.value);
  [go,reset,input,threshold].forEach(e=>e.disabled=true);
  const start=performance.now();
  try{
    tell('Preparing the local AI model. The first run downloads model and runtime assets; keep this tab open.','loading');
    const model=await ensureModel();
    const vectors=[];
    for(let i=0;i<items.length;i++){
      tell(`Reading listing ${i+1} of ${items.length} locally…`,'loading');
      const out=await model(items[i].title+' '+items[i].desc,{pooling:'mean',normalize:true});
      const value=out.tolist();
      vectors.push(Array.isArray(value[0])?value[0]:value);
      await new Promise(r=>setTimeout(r,0));
    }
    const pairs=comparePairs(items,vectors,cutoff);
    for(const pair of pairs){
      const p=document.createElement('article');p.className='pair';
      p.innerHTML=`<div class="pair-head"><strong>${escapeHtml(pair.a.id)} ↔ ${escapeHtml(pair.b.id)}</strong><span class="score">Cosine ${pair.score.toFixed(3)}</span>${pair.identical?'<span class="badge">Same normalized text</span>':''}</div><div class="compare">${[pair.a,pair.b].map(x=>`<section><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.desc||'No description')}</p></section>`).join('')}</div><p class="ev">Shared terms: ${escapeHtml(pair.words.join(', ')||'none')}<br>Word-overlap baseline: ${pair.lexical.toFixed(3)}. Review condition, quantity, size and model differences.</p>`;
      results.appendChild(p);
    }
    tell(`Compared ${items.length} listings (${items.length*(items.length-1)/2} pairs): ${pairs.length} review candidate${pairs.length===1?'':'s'} at cosine ≥ ${cutoff}. ${(performance.now()-start)/1000|0} seconds. ${pairs.length?'These are suggestions, not confirmed duplicates.':'No pair passed this threshold; this does not prove there are no duplicates.'}`,'done');
    window.catalogTwinsLastRun={count:items.length,pairCount:pairs.length,elapsedMs:performance.now()-start,model:'Xenova/all-MiniLM-L6-v2',dtype:'q8',scores:pairs.map(p=>({ids:[p.a.id,p.b.id],score:p.score,lexical:p.lexical,identical:p.identical}))};
  }catch(e){results.replaceChildren();tell('Local AI failed. No result was generated. Check your internet connection for the first model download, then retry. Details: '+String(e.message||e).slice(0,250),'error');}
  finally{[go,reset,input,threshold].forEach(e=>e.disabled=false);}
});
