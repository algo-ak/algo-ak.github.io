(function (scope) {
  'use strict';
  function minimumLevels(records, fanout) {
    let levels=0,capacity=0;
    while(capacity<records){capacity=capacity*fanout+fanout-1;levels++;}
    return levels;
  }
  function occupancyRecords(percent, rounding) {
    const round=rounding==='floor'?Math.floor:Math.ceil;
    const children=round(percent*34/100),entries=round(percent*31/100);
    return {children,entries,total:children**3*entries,valid:children>=17&&entries>=16};
  }
  scope.Chapter14Learning={minimumLevels,occupancyRecords};
  if(typeof document==='undefined')return;
  document.addEventListener('DOMContentLoaded',function(){
    const q=id=>document.getElementById(id),format=n=>n.toLocaleString('en-US');
    function updateHeight(){
      const records=Number(q('height-records').value),fanout=Number(q('height-fanout').value),latency=Number(q('height-latency').value);
      const binary=minimumLevels(records,2),wide=minimumLevels(records,fanout);
      q('height-fanout-label').textContent=fanout;q('wide-fanout').textContent=fanout;
      q('binary-levels').textContent=binary;q('wide-levels').textContent=wide;
      q('binary-time').textContent=format(binary*latency)+' ms';q('wide-time').textContent=format(wide*latency)+' ms';
      q('binary-bar').style.width='100%';q('wide-bar').style.width=(wide/binary*100)+'%';
    }
    ['height-records','height-fanout','height-latency'].forEach(id=>q(id).addEventListener('input',updateHeight));updateHeight();
    let checked=0;
    const pages=[1,15,45,51,72,90];
    function showBook(indexed){
      if(indexed){checked=5;}else{checked=Math.min(5,checked+1);}
      q('book-current').textContent=checked===5?'Chapter Five found.':'You opened Chapter '+checked+'. Keep looking for Chapter Five.';
      q('book-page').textContent=pages[checked-1];
      q('book-entries').querySelectorAll('li').forEach((li,i)=>{li.classList.toggle('book-checked',!indexed&&i<checked-1);li.classList.toggle('book-target',checked===5&&i===4);});
      q('book-feedback').textContent=indexed?'The contents entry says Chapter Five starts on page 72. The index gives you a direct destination.':checked===5?'Found it after checking five chapters. An index can direct the search without opening the earlier chapters.':'Checked '+checked+' chapter'+(checked===1?'':'s')+'. There is no contents lookup yet.';
      q('book-scan').disabled=checked===5;
    }
    q('book-scan').addEventListener('click',()=>showBook(false));q('book-index').addEventListener('click',()=>showBook(true));
    q('book-reset').addEventListener('click',()=>{
      checked=0;q('book-scan').disabled=false;q('book-page').textContent='?';q('book-current').textContent='The book is closed. Where will you look first?';
      q('book-feedback').textContent='Try checking chapters, then use the contents entry. These six entries come from the lecture’s book illustration.';
      q('book-entries').querySelectorAll('li').forEach(li=>li.classList.remove('book-checked','book-target'));
    });
    function updateNode(){
      const count=Number(q('node-count').value),isRoot=q('node-kind').value==='root',min=isRoot?0:2;
      q('node-count-label').textContent=count;
      const cell=q('occupancy-node');cell.replaceChildren();
      for(let i=0;i<Math.max(1,count);i++){const span=document.createElement('span');span.textContent=count?(i+1)*10:'∅';cell.appendChild(span);}
      cell.dataset.state=count>4?'overflow':count<min?'underflow':'valid';
      q('node-feedback').textContent=count>4?'Overflow: '+count+' keys exceed the four-key maximum. In insertion, split the node.':count<min?'Underflow: a non-root leaf needs at least two keys. Borrow from a sibling or merge.':isRoot&&count===0?'Valid empty tree: its only node is an empty leaf root.':'Valid occupancy: this '+(isRoot?'leaf root':'non-root leaf')+' may hold '+min+'…4 keys.';
    }
    ['node-count','node-kind'].forEach(id=>q(id).addEventListener('input',updateNode));updateNode();
    function updateFill(){
      const percent=Number(q('fill-percent').value),rounding=q('fill-rounding').value,r=occupancyRecords(percent,rounding);
      q('fill-label').textContent=percent+'%';q('fill-children').textContent=r.children;q('fill-leaf').textContent=r.entries;q('fill-total').textContent=format(r.total);
      q('fill-total').closest('.fill-equation').dataset.valid=String(r.valid);
      q('fill-note').textContent=(!r.valid?'This floor estimate violates the 16-entry minimum for a non-root leaf, so it is not a valid B+ tree occupancy. ':'')+(rounding==='ceil'?'Ceilings give at least the requested fill at every node.':'Floors give a rounded-down estimate that can fall below the requested fill.')+' The root has the same child count. Actual fill: '+(r.children/34*100).toFixed(1)+'% of child capacity and '+(r.entries/31*100).toFixed(1)+'% of leaf capacity. Internal separator copies are excluded.';
    }
    ['fill-percent','fill-rounding'].forEach(id=>q(id).addEventListener('input',updateFill));updateFill();
    const solved=new Set(),quizzes=document.querySelectorAll('.quick-check');
    quizzes.forEach(quiz=>{
      quiz.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
        const correct=button.dataset.answer===quiz.dataset.correct;
        quiz.querySelectorAll('[data-answer]').forEach(other=>{other.setAttribute('aria-pressed',String(other===button));delete other.dataset.result;});
        button.dataset.result=correct?'correct':'incorrect';quiz.dataset.solved=String(correct);
        quiz.querySelector('.check-feedback').textContent=(correct?'Correct. ':'Try again. ')+(correct?quiz.dataset.right:quiz.dataset.wrong);
        if(correct)solved.add(quiz.id);
        q('chapter-check-progress').textContent=solved.size+' of '+quizzes.length+' quick checks explored';
      }));
    });
  });
})(typeof window!=='undefined'?window:globalThis);
