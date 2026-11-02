(function(scope){
  'use strict';
  const mod=(key,size)=>((key%size)+size)%size;
  const copy=table=>table.slice();
  const stepFor=key=>[1,3,7,9][mod(key,4)];
  function probeIndex(key,i,mode){return mod(mod(key,10)+(mode==='linear'?i:mode==='quadratic'?i*i:i*stepFor(key)),10);}
  function buildProbe(keys,mode){
    let table=Array(10).fill(null),total=0;
    const frames=[{table:copy(table),active:-1,key:null,path:[],total:0,phase:'ready',message:'The table has 10 empty slots. Insert keys in the given order.'}];
    for(const key of keys){
      if(table.includes(key)){frames.push({table:copy(table),active:table.indexOf(key),key,path:[],total,phase:'duplicate',message:'Key '+key+' is already present. This set example does not insert duplicates.'});continue;}
      const path=[];let inserted=false;
      for(let i=0;i<10;i++){
        const slot=probeIndex(key,i,mode);path.push(slot);total++;
        frames.push({table:copy(table),active:slot,key,i,path:path.slice(),total,phase:'probe',message:'Key '+key+': probe i='+i+' checks slot '+slot+'. '+(table[slot]===null?'The slot is empty.':'It holds '+table[slot]+'; continue probing.')});
        if(table[slot]===null){table[slot]=key;inserted=true;frames.push({table:copy(table),active:slot,key,i,path:path.slice(),total,phase:'inserted',message:'Insert '+key+' in slot '+slot+' after '+path.length+' probe'+(path.length===1?'':'s')+'.'});break;}
      }
      if(!inserted){frames.push({table:copy(table),active:-1,key,path:path.slice(),total,phase:'failed',message:'Cannot insert '+key+': all '+new Set(path).size+' reachable slots are occupied. '+(table.includes(null)?'Empty slots remain outside this probe sequence.':'The table is full.')});break;}
    }
    return frames.map(frame=>({...frame,mode}));
  }
  function frequency(text,ignoreWhitespace){
    const counts=new Map();let scanned=0,used=0;
    for(const character of text){scanned++;if(ignoreWhitespace&&/\s/u.test(character))continue;counts.set(character,(counts.get(character)||0)+1);used++;}
    return {counts,scanned,used,repeated:[...counts].filter(pair=>pair[1]>1)};
  }
  function buildChain(){
    const chain=[],frames=[{chain:[31,21,11,1],key:null,message:'Bucket 1 points to 31 → 21 → 11 → 1 → null. Use Step to rebuild this chain from an empty table.'},{chain:[],key:null,message:'Start with an empty table. The ten bucket heads are null.'}];
    for(const key of [1,11,21,31]){chain.unshift(key);frames.push({chain:chain.slice(),key,message:'Insert '+key+' at the head of bucket 1. Its next pointer refers to '+(chain.length>1?chain[1]:'null')+'.'});}
    return frames;
  }
  function chainGeometry(frame){
    const head={x:268,y:124};
    const nodes=frame.chain.map((key,i)=>({key,x:330+i*94,y:100,width:74,height:48,pointer:{x:391+i*94,y:124}}));
    const edges=nodes.map((n,i)=>({from:i?nodes[i-1].key:'bucket-1',to:n.key,start:i?nodes[i-1].pointer:head,end:{x:n.x-4,y:124}}));
    if(nodes.length)edges.push({from:nodes.at(-1).key,to:null,start:nodes.at(-1).pointer,end:{x:nodes.at(-1).x+110,y:124}});
    return {head,nodes,edges,width:780,height:430};
  }
  function drawChain(svg,frame){
    const doc=svg.ownerDocument||document,NS='http://www.w3.org/2000/svg',g=chainGeometry(frame),prefix=svg.id;
    svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+g.width+' '+g.height);svg.setAttribute('width',g.width);svg.setAttribute('height',g.height);
    function add(tag,attrs={},text,parent=svg){const el=doc.createElementNS(NS,tag);for(const [name,value] of Object.entries(attrs))el.setAttribute(name,value);if(text!==undefined)el.textContent=text;parent.appendChild(el);return el;}
    function text(x,y,label,className='chain-svg-label',extra={}){return add('text',{x,y,class:className,...extra},label);}
    add('title',{},'Hash table with separate chaining');
    add('desc',{},'Ten buckets indexed 0 through 9. Hash function h(k)=k mod 10 maps 1, 11, 21, 31 to bucket 1. '+(frame.chain.length?'Bucket 1 links to '+frame.chain.join(', ')+', then null.':'All bucket heads are null.'));
    const defs=add('defs'),marker=add('marker',{id:prefix+'-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8,markerHeight:8,orient:'auto',markerUnits:'userSpaceOnUse'},undefined,defs);
    add('path',{d:'M 0 0 L 10 5 L 0 10 Z',fill:'#0b7285'},undefined,marker);
    function arrow(path,attrs={}){return add('path',{d:path,fill:'none',stroke:'#0b7285','stroke-width':2,'marker-end':'url(#'+prefix+'-arrow)',...attrs});}
    text(36,35,'KEYS');text(162,35,'HASH FUNCTION');text(254,35,'HASH TABLE');text(530,35,'LINKED LIST');
    for(const [i,key] of [1,11,21,31].entries()){
      const y=72+i*40,active=key===frame.key;
      add('rect',{x:14,y,width:44,height:28,rx:5,fill:active?'#dff2e9':'#f2f6fa',stroke:active?'#438d76':'#c6d5e2'});
      text(36,y+15,key,'chain-svg-key');arrow('M 58 '+(y+14)+' C 85 '+(y+14)+', 95 124, 120 124',{'stroke-width':1.5});
    }
    add('rect',{x:124,y:96,width:76,height:56,rx:8,fill:'#e8f4f7',stroke:'#72a8b5'});
    text(162,115,'h(k)','chain-svg-key');text(162,138,'k mod 10','chain-svg-math');
    arrow('M 200 124 H 216');
    text(234,63,'index','chain-svg-label chain-svg-column');text(268,63,'head','chain-svg-label chain-svg-column');
    for(let i=0;i<10;i++){
      const y=76+i*32,occupied=i===1&&frame.chain.length;
      add('rect',{x:220,y,width:68,height:32,fill:occupied?'#e5f5ed':'#fff',stroke:'#b7cad8','stroke-width':1});
      add('path',{d:'M 248 '+y+' v 32',stroke:'#b7cad8'});
      text(234,y+17,i,'chain-svg-index');
      if(occupied)add('circle',{cx:268,cy:y+16,r:4,fill:'#0b7285'});
      else text(268,y+17,'∅','chain-svg-null');
    }
    for(const n of g.nodes){
      const active=n.key===frame.key;
      text(n.x+24,84,'key');text(n.x+61,84,'next');
      add('rect',{'data-chain-key':n.key,x:n.x,y:n.y,width:n.width,height:n.height,rx:5,fill:active?'#dff2e9':'#f8fcfa',stroke:active?'#438d76':'#8bb8a7','stroke-width':active?2:1.5});
      add('path',{d:'M '+(n.x+48)+' '+n.y+' v '+n.height,stroke:'#8bb8a7'});
      text(n.x+24,125,n.key,'chain-svg-key');
      add('circle',{cx:n.pointer.x,cy:n.pointer.y,r:4,fill:'#0b7285'});
    }
    for(const e of g.edges)arrow('M '+e.start.x+' '+e.start.y+' H '+e.end.x,{'data-chain-from':e.from,'data-chain-to':e.to===null?'null':e.to});
    if(g.nodes.length)text(g.edges.at(-1).end.x+14,125,'∅','chain-svg-null');
    text(124,274,'h(1) = h(11)','chain-svg-math');text(124,298,'= h(21) = h(31) = 1','chain-svg-math');
    const description=doc.getElementById('chain-structure');if(description)description.textContent='Bucket 1: '+(frame.chain.length?frame.chain.join(' → ')+' → ':'')+'null. Buckets 0 and 2–9: null.';
  }
  const deletionFrames=[
    {badActive:-1,goodActive:-1,badStatus:'Search has not started',goodStatus:'Search has not started',message:'After deleting 11, compare an ordinary EMPTY slot with a DELETED tombstone. Search for 31 using linear probing.'},
    {badActive:1,goodActive:1,badStatus:'Slot 1 holds 1; continue',goodStatus:'Slot 1 holds 1; continue',message:'h(31)=1. Slot 1 contains a different key, so both searches continue.'},
    {badActive:2,goodActive:2,badStatus:'Stops: incorrectly reports not found',goodStatus:'DELETED: continue searching',message:'At slot 2, EMPTY terminates the left search too early. A tombstone tells the right search to continue.'},
    {badActive:2,goodActive:3,badStatus:'Stopped before reaching 31',goodStatus:'Slot 3 holds 21; continue',message:'The right search passes the tombstone and checks slot 3.'},
    {badActive:2,goodActive:4,badStatus:'Incorrect: 31 is still in the table',goodStatus:'Found 31 in slot 4',message:'The tombstone preserves the probe path. The right search finds 31 in slot 4.'}
  ];
  function bloomHashes(word){
    return [2166136261,2654435761,5381].map((seed,i)=>{
      let value=seed>>>0;
      for(const character of word)value=Math.imul(value^character.codePointAt(0),[16777619,2246822519,3266489917][i])>>>0;
      return value%16;
    });
  }
  function makeBloom(){
    const bits=Array(16).fill(0),words=new Set();
    return {bits,words,add(word){bloomHashes(word).forEach(i=>bits[i]=1);words.add(word);},test(word){const hashes=bloomHashes(word);return {hashes,possible:hashes.every(i=>bits[i]===1),actual:words.has(word)};},reset(){bits.fill(0);words.clear();}};
  }
  const resizeKeys=[1,25,112,123,994,1253,1327];
  function buildResize(){
    let old=resizeKeys.slice(),moved=[];
    const frames=[{old:old.slice(),moved:[],key:null,message:'Seven keys occupy an 8-bucket chained table: α=7/8. Grow to 16 buckets and recompute every address.'}];
    for(const key of resizeKeys){old=old.filter(k=>k!==key);moved.push(key);frames.push({old:old.slice(),moved:moved.slice(),key,message:'Move '+key+': old bucket '+mod(key,8)+' → new bucket '+mod(key,16)+'. Use h(k)=k mod 16 in the new table.'});}
    return frames;
  }
  scope.Chapter15={mod,stepFor,probeIndex,buildProbe,frequency,buildChain,chainGeometry,drawChain,deletionFrames,bloomHashes,makeBloom,buildResize,resizeKeys};
  if(typeof document==='undefined')return;
  document.addEventListener('DOMContentLoaded',function(){
    const q=id=>document.getElementById(id);
    function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
    function renderSlots(container,table,active,tombstone){
      container.replaceChildren();
      table.forEach((value,i)=>{const state=i===tombstone?'deleted':value===null?'empty':'occupied';const slot=element('li','hash-slot '+state+(active===i?' active':''));slot.append(element('span','slot-index',i),element('strong','slot-value',state==='deleted'?'DEL':value===null?'∅':value));slot.setAttribute('aria-label','Slot '+i+': '+(state==='deleted'?'DELETED':value===null?'EMPTY':value));container.appendChild(slot);});
    }
    function showFrequency(){
      const r=frequency(q('character-input').value,q('ignore-spaces').checked);q('character-result').replaceChildren();
      r.repeated.forEach(([character,count])=>{const label=character===' '?'space':character==='\n'?'newline':character==='\t'?'tab':character;q('character-result').appendChild(element('span','character-chip',label+' × '+count));});
      if(!r.repeated.length)q('character-result').appendChild(element('span','character-chip','No repeated characters'));
      q('character-message').textContent='Scanned '+r.scanned+' Unicode code points; counted '+r.used+'; '+r.repeated.length+' distinct characters repeat.';
    }
    ['character-input','ignore-spaces'].forEach(id=>q(id).addEventListener('input',showFrequency));showFrequency();
    function updateAddress(){const key=Number(q('address-input').value);if(!q('address-input').value.trim()||!Number.isSafeInteger(key)||Math.abs(key)>1000000000){q('address-key').textContent='—';q('address-slot').textContent='—';q('address-message').textContent='Enter an integer between −1,000,000,000 and 1,000,000,000.';return;}q('address-key').textContent=key;q('address-slot').textContent=mod(key,10);q('address-message').textContent='Key '+key+' maps to slot '+mod(key,10)+'. Different keys may have this same address.';}
    q('address-input').addEventListener('input',updateAddress);updateAddress();
    function updateFolding(){const text=q('fold-input').value.trim();q('fold-parts').replaceChildren();if(!/^\d{1,24}$/.test(text)){q('fold-sum').textContent='—';q('fold-result').textContent='—';q('fold-message').textContent='Enter 1–24 digits.';return;}const chunks=text.match(/.{1,2}/g).map(Number),sum=chunks.reduce((a,b)=>a+b,0);chunks.forEach((chunk,i)=>{if(i)q('fold-parts').appendChild(element('span','math-symbol','+'));q('fold-parts').appendChild(element('span','fold-part',chunk));});q('fold-sum').textContent=sum;q('fold-result').textContent=mod(sum,11);q('fold-message').textContent='Group digits from the left in pairs, add the groups, then take the sum modulo 11.';}
    q('fold-input').addEventListener('input',updateFolding);updateFolding();
    scope.ChapterUI.player({frames:buildChain(),play:'chain-play',step:'chain-step',reset:'chain-reset',speed:'chain-speed',status:'chain-status',render(frame){drawChain(q('chain-diagram'),frame);q('chain-message').textContent=frame.message;}});
    q('chain-enlarge').addEventListener('click',()=>{const enlarged=q('chain-viewport').classList.toggle('enlarged');q('chain-enlarge').textContent=enlarged?'Fit diagram':'Enlarge';q('chain-enlarge').setAttribute('aria-pressed',String(enlarged));});
    let probePlayer,loadedMode='linear';
    function renderProbe(frame){
      renderSlots(q('probe-table'),frame.table,frame.active);q('probe-message').textContent=frame.message;q('probe-key').textContent=frame.key===null?'—':frame.key;q('probe-total').textContent=frame.total;q('probe-load').textContent=(frame.table.filter(v=>v!==null).length/10).toFixed(1);
      q('probe-path').replaceChildren();frame.path.forEach((slot,i)=>{if(i)q('probe-path').appendChild(element('span','probe-arrow','→'));q('probe-path').appendChild(element('span','probe-visit'+(i===frame.path.length-1?' current':''),slot));});
      if(!frame.path.length)q('probe-path').appendChild(element('span','path-empty','Probe indices appear here.'));
      q('probe-formula').textContent=frame.mode==='linear'?'hᵢ(k) = (k mod 10 + i) mod 10':frame.mode==='quadratic'?'hᵢ(k) = (k mod 10 + i²) mod 10':'hᵢ(k) = (k mod 10 + i × h₂(k)) mod 10; h₂(k) = [1,3,7,9][k mod 4]';
    }
    function loadProbe(){
      const raw=q('probe-keys').value.trim(),tokens=raw?raw.split(/[,\s]+/):[];
      if(!tokens.length||tokens.length>15||tokens.some(t=>!/^[-+]?\d+$/.test(t)||!Number.isSafeInteger(Number(t))||Math.abs(Number(t))>1000000000)){q('probe-mode').value=loadedMode;q('probe-validation').textContent='Enter 1–15 integers separated by commas; each must be between −1,000,000,000 and 1,000,000,000.';return;}
      q('probe-validation').textContent='';loadedMode=q('probe-mode').value;const frames=buildProbe(tokens.map(Number),loadedMode);
      if(probePlayer)probePlayer.reset(frames);else probePlayer=scope.ChapterUI.player({frames,play:'probe-play',step:'probe-step',reset:'probe-reset',speed:'probe-speed',status:'probe-status',render:renderProbe});
    }
    q('probe-load-keys').addEventListener('click',loadProbe);q('probe-mode').addEventListener('change',loadProbe);q('probe-stress').addEventListener('click',()=>{q('probe-keys').value='1,11,21,31,41,51,61';loadProbe();});loadProbe();
    const deletedTable=Array(10).fill(null);deletedTable[1]=1;deletedTable[3]=21;deletedTable[4]=31;
    scope.ChapterUI.player({frames:deletionFrames,play:'delete-play',step:'delete-step',reset:'delete-reset',speed:'delete-speed',status:'delete-status',render(frame){renderSlots(q('delete-bad'),deletedTable,frame.badActive);renderSlots(q('delete-good'),deletedTable,frame.goodActive,2);q('delete-bad-result').textContent=frame.badStatus;q('delete-good-result').textContent=frame.goodStatus;q('delete-message').textContent=frame.message;}});
    const bloom=makeBloom();let bloomLast=[];
    function drawBloom(){q('bloom-bits').replaceChildren();bloom.bits.forEach((value,i)=>{const bit=element('li','bloom-bit'+(value?' on':'')+(bloomLast.includes(i)?' selected':''));bit.append(element('small','',i),element('strong','',value));bit.setAttribute('aria-label','Bit '+i+': '+value);q('bloom-bits').appendChild(bit);});q('bloom-words').textContent=bloom.words.size?[...bloom.words].join(', '):'None';q('bloom-filled').textContent=bloom.bits.filter(Boolean).length+' / 16';q('bloom-hashes').textContent=bloomLast.length?bloomLast.map((index,i)=>'h'+(i+1)+' → '+index).join(' · '):'Three bit positions appear here.';}
    function bloomWord(){const word=q('bloom-input').value.trim();if(!word){q('bloom-message').textContent='Enter a non-empty word.';return null;}return word;}
    function testBloom(word){const result=bloom.test(word);bloomLast=result.hashes;drawBloom();q('bloom-verdict').textContent=result.possible?'Possibly present':'Definitely absent';q('bloom-verdict').dataset.verdict=result.possible?'possible':'absent';q('bloom-message').textContent=result.possible?(result.actual?'All three tested bits are 1. This word was added. The filter alone only says “possibly present”.':'All three tested bits are 1, but this word is absent from the recorded insertions: a false positive.'):'At least one tested bit is 0, so this word was never added to this filter.';}
    q('bloom-add').addEventListener('click',()=>{const word=bloomWord();if(word===null)return;bloom.add(word);bloomLast=bloomHashes(word);drawBloom();q('bloom-verdict').textContent='Word added';q('bloom-message').textContent='Set the three hash positions for “'+word+'”. Existing 1 bits stay set.';});
    q('bloom-test').addEventListener('click',()=>{const word=bloomWord();if(word!==null)testBloom(word);});
    q('bloom-reset').addEventListener('click',()=>{bloom.reset();bloomLast=[];drawBloom();q('bloom-verdict').textContent='Empty filter';q('bloom-message').textContent='No words have been added.';});
    q('bloom-false-positive').addEventListener('click',()=>{bloom.reset();bloom.add('tree');bloom.add('book');let candidate;for(let i=0;i<10000;i++){const word='word'+i;if(bloom.test(word).possible){candidate=word;break;}}q('bloom-input').value=candidate;testBloom(candidate);});
    drawBloom();
    function drawBuckets(container,keys,size,active){container.replaceChildren();for(let i=0;i<size;i++){const bucket=element('li','resize-bucket'+(active!==null&&mod(active,size)===i?' active':''));bucket.append(element('small','',i),element('span','',keys.filter(k=>mod(k,size)===i).join(', ')||'∅'));container.appendChild(bucket);}}
    scope.ChapterUI.player({frames:buildResize(),play:'resize-play',step:'resize-step',reset:'resize-reset',speed:'resize-speed',status:'resize-status',render(frame){drawBuckets(q('resize-old'),frame.old,8,frame.key);drawBuckets(q('resize-new'),frame.moved,16,frame.key);q('resize-message').textContent=frame.message;}});
    document.querySelectorAll('.hash-question').forEach(question=>question.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{question.querySelectorAll('[data-answer]').forEach(other=>{other.setAttribute('aria-pressed',String(button===other));other.removeAttribute('data-result');});const correct=button.dataset.answer===question.dataset.correct;button.dataset.result=correct?'correct':'incorrect';question.querySelector('.question-feedback').textContent=(correct?'Correct. ':'Try again. ')+question.dataset[correct?'right':'wrong'];})));
  });
})(typeof window==='undefined'?globalThis:window);
