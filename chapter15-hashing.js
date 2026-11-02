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
    const chain=[],frames=[{chain:[],key:null,message:'All keys hash to bucket 1. Other buckets are empty.'}];
    for(const key of [1,11,21,31]){chain.unshift(key);frames.push({chain:chain.slice(),key,message:'Insert '+key+' at the head of bucket 1. Its next pointer refers to '+(chain.length>1?chain[1]:'null')+'.'});}
    return frames;
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
  scope.Chapter15={mod,stepFor,probeIndex,buildProbe,frequency,buildChain,deletionFrames,bloomHashes,makeBloom,buildResize,resizeKeys};
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
    scope.ChapterUI.player({frames:buildChain(),play:'chain-play',step:'chain-step',reset:'chain-reset',speed:'chain-speed',status:'chain-status',render(frame){q('chain-nodes').replaceChildren();q('chain-nodes').appendChild(element('span','chain-head','Bucket 1'));for(const key of frame.chain){q('chain-nodes').append(element('span','chain-arrow','→'),element('span','chain-key'+(key===frame.key?' active':''),key));}q('chain-nodes').append(element('span','chain-arrow','→'),element('span','chain-null','∅'));q('chain-message').textContent=frame.message;}});
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
