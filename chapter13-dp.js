/* Chapter 13: deterministic traces generated from the recurrences. */
document.addEventListener('DOMContentLoaded', () => {
  const byId = id => document.getElementById(id);
  const copy = table => table.map(row => row.slice());
  const chip = (text, cls = '') => `<span class="chip ${cls}">${text}</span>`;
  function player(prefix, frames, render) {
    let position = 0, timer = null;
    const play = byId(prefix + '-play'), step = byId(prefix + '-step');
    const stop = () => { clearTimeout(timer); timer = null; };
    function draw() {
      render(frames[position]);
      byId(prefix + '-status').textContent = `Step ${position + 1} / ${frames.length}`;
      play.textContent = timer !== null ? 'Pause' : position === frames.length - 1 ? 'Replay' : 'Play';
      play.setAttribute('aria-label', play.textContent + ' ' + prefix + ' demonstration');
      step.disabled = position === frames.length - 1;
    }
    function schedule() {
      timer = setTimeout(() => {
        position++;
        if (position === frames.length - 1) stop(); else schedule();
        draw();
      }, Number(byId(prefix + '-speed').value));
    }
    play.addEventListener('click', () => {
      if (timer !== null) stop();
      else { if (position === frames.length - 1) position = 0; schedule(); }
      draw();
    });
    step.addEventListener('click', () => { stop(); position = Math.min(position + 1, frames.length - 1); draw(); });
    byId(prefix + '-reset').addEventListener('click', () => { stop(); position = 0; draw(); });
    byId(prefix + '-speed').addEventListener('change', () => { if (timer !== null) { stop(); schedule(); draw(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); draw(); } });
    const lab = play.closest('.lab');
    const legend = document.createElement('p'); legend.className = 'dp-legend';
    legend.textContent = 'Amber: current state · Violet: dependency · Teal: computed state';
    lab.querySelector('.lab-head').after(legend);
    draw();
  }
  let memo = {}, stack = [], fibFrames = [];
  const record = (n, message) => fibFrames.push({ n, message, memo: {...memo}, stack: stack.slice() });
  record(5, 'Start with F(5). Each stored value will be reused by later calls.');
  function fib(n) {
    stack.push(n); record(n, `Call F(${n}). Active calls: ${stack.map(v => 'F(' + v + ')').join(' → ')}.`);
    if (memo[n] !== undefined) record(n, `Cache hit: F(${n})=${memo[n]}. No further recursive calls are needed.`);
    else {
      memo[n] = n < 2 ? n : fib(n - 1) + fib(n - 2);
      record(n, n < 2 ? `Base case: store F(${n})=${n}.` : `Store F(${n})=F(${n-1})+F(${n-2})=${memo[n]}.`);
    }
    stack.pop(); return memo[n];
  }
  fib(5); record(5, 'Complete: F(5)=5. Six distinct states are stored; subsequent requests use the cache.');
  player('fib', fibFrames, f => {
    byId('fib-state').innerHTML = `<strong>Call stack</strong><div class="dp-stack">${f.stack.length ? f.stack.map(n => chip('F(' + n + ')', n === f.n ? 'active' : '')).join('') : chip('Complete', 'done')}</div>`;
    byId('fib-table').innerHTML = Array.from({length:6}, (_, n) => chip(`F[${n}] = ${f.memo[n] ?? '—'}`, n === f.n ? 'active' : f.memo[n] !== undefined ? 'done' : '')).join('');
    byId('fib-message').textContent = f.message;
  });
  function table(id, data, row, col, dependencies = [], path = []) {
    let html = `<caption class="sr-only">Dynamic programming states and dependencies</caption><thead><tr><th scope="col">${id === 'fw-table' ? 'From / To' : 'State'}</th>`;
    const start = id === 'mc-table' || id === 'fw-table' ? 1 : 0;
    for (let j = start; j < data[0].length; j++) html += `<th scope="col">${j}</th>`;
    html += '</tr></thead><tbody>';
    for (let i = start; i < data.length; i++) {
      html += `<tr><th scope="row">${i}</th>`;
      for (let j = start; j < data[i].length; j++) {
        const key = i + ',' + j, value = data[i][j];
        const cls = i === row && j === col ? 'active' : path.includes(key) ? 'solution' : dependencies.includes(key) ? 'dependency' : value !== null ? 'done' : '';
        html += `<td class="${cls}">${value === null ? '—' : value === Infinity ? '∞' : value}</td>`;
      }
      html += '</tr>';
    }
    byId(id).innerHTML = html + '</tbody>';
  }
  const profits = [0,1,2,5,6], weights = [0,2,3,4,5];
  const kp = Array.from({length:5}, (_, i) => Array.from({length:9}, (_, w) => i === 0 || w === 0 ? 0 : null));
  const kpFrames = [{data:copy(kp), i:0, w:0, deps:[], choice:'Base cases', message:'No items or no capacity: profit is zero. Uncomputed states are shown as dashes.'}];
  for (let i = 1; i <= 4; i++) for (let w = 1; w <= 8; w++) {
    const exclude = kp[i-1][w], fits = weights[i] <= w;
    const include = fits ? profits[i] + kp[i-1][w-weights[i]] : -Infinity;
    kp[i][w] = Math.max(exclude, include);
    kpFrames.push({data:copy(kp), i, w, deps:[`${i-1},${w}`, ...(fits ? [`${i-1},${w-weights[i]}`] : [])], choice:`Exclude: ${exclude} · Include: ${fits ? include : 'does not fit'}`, message:`KP(${i},${w})=${kp[i][w]}. ${fits && include > exclude ? 'Include item ' + i : 'Keep the previous-row solution'}; both choices use only the first ${i-1} items.`});
  }
  let w = 8, selected = [], path = [];
  for (let i = 4; i > 0; i--) {
    path.push(`${i},${w}`);
    if (kp[i][w] !== kp[i-1][w]) { selected.push(i); w -= weights[i]; }
    kpFrames.push({data:copy(kp), i:i-1, w, deps:[], path:path.slice(), choice:'Selected items: ' + (selected.join(', ') || 'none yet'), message:`Trace back row ${i}: ${selected.includes(i) ? 'take item ' + i + ' and subtract its weight' : 'skip item ' + i}. Remaining capacity: ${w}.`});
  }
  kpFrames.push({data:copy(kp), i:4, w:8, deps:[], path, choice:'Items 2 + 4 · Weight 8 · Profit 8', message:'Optimal solution: select items 2 and 4. Their weights are 3+5=8 and profits are 2+6=8.'});
  player('kp', kpFrames, f => { table('kp-table', f.data, f.i, f.w, f.deps, f.path); byId('kp-choice').textContent = f.choice; byId('kp-message').textContent = f.message; });
  const p = [2,3,4,5,2], m = Array.from({length:5}, () => Array(5).fill(null)), splits = {};
  for (let i = 1; i <= 4; i++) m[i][i] = 0;
  const mcFrames = [{data:copy(m), i:1, j:1, deps:[], choice:'Chain length 1', message:'A single matrix requires no multiplication: m[i,i]=0.'}];
  for (let length = 2; length <= 4; length++) for (let i = 1; i <= 5-length; i++) {
    const j = i + length-1; m[i][j] = Infinity;
    for (let k = i; k < j; k++) {
      const cost = m[i][k] + m[k+1][j] + p[i-1]*p[k]*p[j];
      if (cost < m[i][j]) { m[i][j] = cost; splits[i+','+j] = k; }
      mcFrames.push({data:copy(m), i, j, deps:[`${i},${k}`, `${k+1},${j}`], choice:`Chain length ${length} · Try split k=${k} · Best so far: ${m[i][j]}`, message:`Candidate = ${m[i][k]} + ${m[k+1][j]} + ${p[i-1]}×${p[k]}×${p[j]} = ${cost}. Compare this cost with the best split found so far.`});
    }
  }
  function order(i,j) { if(i === j) return 'A'+i; const k = splits[i+','+j]; return '('+order(i,k)+' × '+order(k+1,j)+')'; }
  mcFrames.push({data:copy(m), i:1, j:4, deps:[], choice:order(1,4), message:'Complete: minimum cost 76. Multiply A3A4 first (40), then A2 with that result (24), then A1 (12).'});
  player('mc', mcFrames, f => {table('mc-table', f.data, f.i, f.j, f.deps); byId('mc-choice').textContent=f.choice; byId('mc-message').textContent=f.message;});
  // The graph and update order match the four-vertex example in the lecture.
  const distances = [
    Array(5).fill(null),
    [null, 0, 4, Infinity, 8],
    [null, 9, 0, 2, Infinity],
    [null, 6, Infinity, 0, 1],
    [null, 2, Infinity, Infinity, 0]
  ];
  const distanceText = value => value === Infinity ? '∞' : value;
  const fwFrames = [{data:copy(distances), k:0, i:0, j:0, deps:[],
    choice:'D⁽⁰⁾ · No intermediate vertices allowed',
    message:'Initialize from the directed graph: diagonal entries are 0, direct edges use their weights, and missing edges are ∞.'}];
  for (let k = 1; k <= 4; k++) {
    fwFrames.push({data:copy(distances), k, i:0, j:0, deps:[],
      choice:`Phase k=${k} · Allow vertex ${k} as an intermediate`,
      message:`Check every ordered pair (i,j). Compare its current distance with D[i,${k}] + D[${k},j]. Steps show the entries that improve.`});
    let improvements = 0;
    for (let i = 1; i <= 4; i++) for (let j = 1; j <= 4; j++) {
      const previous = distances[i][j], left = distances[i][k], right = distances[k][j];
      const via = left + right;
      if (via < previous) {
        distances[i][j] = via;
        improvements++;
        fwFrames.push({data:copy(distances), k, i, j, deps:[`${i},${k}`, `${k},${j}`],
          choice:`k=${k} · Update D[${i},${j}] · Via vertex ${k}`,
          message:`D[${i},${j}]: ${distanceText(previous)} → ${via}. Through ${k}: ${left} + ${right} = ${via}, which is smaller than ${distanceText(previous)}.`});
      }
    }
    fwFrames.push({data:copy(distances), k, i:0, j:0, deps:[],
      choice:`D⁽${k}⁾ complete · Intermediate vertices 1…${k}`,
      message:`All 16 ordered pairs have been checked for k=${k}; ${improvements} distances improved. The matrix now allows vertices 1…${k} inside a path.`});
  }
  fwFrames.push({data:copy(distances), k:4, i:2, j:1, deps:[],
    choice:'Final D⁽⁴⁾ · Shortest route 2 → 3 → 4 → 1',
    message:'Complete: D[2,1]=5. The route 2 → 3 → 4 → 1 costs 2+1+2=5, improving on the direct edge of weight 9.'});
  player('fw', fwFrames, f => {
    table('fw-table', f.data, f.i, f.j, f.deps);
    byId('fw-table').querySelector('caption').textContent = 'Floyd–Warshall distances: rows are source vertices and columns are destination vertices';
    byId('fw-state').textContent = f.choice;
    byId('fw-message').textContent = f.message;
    const graph = byId('fw-live-graph');
    graph.querySelectorAll('[data-vertex]').forEach(node => {
      node.classList.toggle('fw-intermediate', Number(node.dataset.vertex) === f.k);
    });
    const final = f.message.startsWith('Complete:');
    graph.querySelectorAll('[data-edge]').forEach(edge => {
      edge.classList.toggle('fw-route', final && ['2-3','3-4','4-1'].includes(edge.dataset.edge));
    });
  });
  const prices=[0,1,5,8,9,10,17,17,20,24,30], revenue=[0], first=[0];
  const rodFrames=[{values:[0], n:0, cut:0, best:0, message:'Base case: an empty rod has revenue zero.'}];
  for(let n=1;n<=10;n++) {
    let best=-Infinity;
    for(let cut=1;cut<=n;cut++) {
      const candidate=prices[cut]+revenue[n-cut];
      if(candidate>best){best=candidate;first[n]=cut;}
      rodFrames.push({values:revenue.slice(), n, cut, best, message:`Length ${n}, first piece ${cut}: price ${prices[cut]} + r[${n-cut}]=${revenue[n-cut]} gives ${candidate}. Best revenue so far: ${best}.`});
    }
    revenue[n]=best;
    let remaining=n, pieces=[];
    while(remaining>0){pieces.push(first[remaining]);remaining-=first[remaining];}
    rodFrames.push({values:revenue.slice(), n, cut:first[n], best, pieces, message:`Store r[${n}]=${best}. Recover an optimal decomposition: ${pieces.join(' + ')}.`});
  }
  player('rod',rodFrames,f=>{
    byId('rod-values').innerHTML=Array.from({length:11},(_,i)=>chip(`r[${i}] = ${f.values[i] ?? '—'}`, i===f.n?'active':i===f.n-f.cut?'dependency':f.values[i]!==undefined?'done':'')).join('');
    const segments=f.pieces || (f.n ? [f.cut,f.n-f.cut].filter(Boolean):[]);
    byId('rod-track').innerHTML=segments.map((length,i)=>`<span style="flex:${length}" class="${i===0?'rod-piece':'rod-remainder'}">${length}</span>`).join('') || '<span>Empty rod · length 0</span>';
    byId('rod-message').textContent=f.message;
  });

  const x='ABCBDAB', y='BDCABA';
  const lcs=Array.from({length:x.length+1},(_,i)=>Array.from({length:y.length+1},(_,j)=>i===0||j===0?0:null));
  const lcsFrames=[{data:copy(lcs),i:0,j:0,deps:[],path:[],result:'',message:'Initialize the empty-prefix row and column to zero. Each remaining cell describes two prefixes.'}];
  for(let i=1;i<=x.length;i++) for(let j=1;j<=y.length;j++) {
    const match=x[i-1]===y[j-1];
    lcs[i][j]=match?1+lcs[i-1][j-1]:Math.max(lcs[i-1][j],lcs[i][j-1]);
    lcsFrames.push({data:copy(lcs),i,j,deps:match?[`${i-1},${j-1}`]:[`${i-1},${j}`,`${i},${j-1}`],path:[],result:'',message:match?`X[${i-1}] and Y[${j-1}] both equal ${x[i-1]}. Extend the diagonal: 1 + ${lcs[i-1][j-1]} = ${lcs[i][j]}.`:`${x[i-1]} differs from ${y[j-1]}. Drop one last character: max(above ${lcs[i-1][j]}, left ${lcs[i][j-1]}) = ${lcs[i][j]}.`});
  }
  let li=x.length,lj=y.length,letters=[],lcsPath=[];
  lcsFrames.push({data:copy(lcs),i:li,j:lj,deps:[],path:[],result:'',message:`The table is complete: L[${li},${lj}]=${lcs[li][lj]}. Now reconstruct a sequence from the bottom-right corner.`});
  while(li>0&&lj>0){
    const i=li,j=lj;lcsPath.push(`${i},${j}`);let message;
    if(x[i-1]===y[j-1]){letters.push(x[i-1]);li--;lj--;message=`Match ${x[i-1]}: record it and move diagonally to L[${li},${lj}].`;}
    else if(lcs[i-1][j]>=lcs[i][j-1]){li--;message=`Move up to L[${li},${lj}]: ${lcs[i-1][j]} ≥ ${lcs[i][j-1]}. Skip X[${i-1}]=${x[i-1]}; ties choose up.`;}
    else{lj--;message=`Move left to L[${li},${lj}]: ${lcs[i][j-1]} > ${lcs[i-1][j]}. Skip Y[${j-1}]=${y[j-1]}.`;}
    lcsFrames.push({data:copy(lcs),i:li,j:lj,deps:[`${i},${j}`],path:lcsPath.slice(),result:letters.slice().reverse().join(''),message});
  }
  lcsFrames.push({data:copy(lcs),i:li,j:lj,deps:[],path:lcsPath.slice(),result:letters.slice().reverse().join(''),message:'Complete: length 4, LCS BCBA. The recorded characters A, B, C, B are reversed to restore their original order.'});
  player('lcs',lcsFrames,f=>{
    let html='<caption>L[i,j]: LCS length of the first i characters of X and first j characters of Y</caption><thead><tr><th scope="col">X / Y</th><th scope="col">0 · ∅</th>';
    for(let j=1;j<=y.length;j++)html+=`<th scope="col">${j} · ${y[j-1]}</th>`;
    html+='</tr></thead><tbody>';
    for(let i=0;i<=x.length;i++){
      html+=`<tr><th scope="row">${i} · ${i?x[i-1]:'∅'}</th>`;
      for(let j=0;j<=y.length;j++){
        const key=`${i},${j}`,value=f.data[i][j];
        const cls=i===f.i&&j===f.j?'active':f.deps.includes(key)?'dependency':f.path.includes(key)?'solution':value!==null?'done':'';
        html+=`<td class="${cls}">${value??'—'}</td>`;
      }html+='</tr>';
    }
    byId('lcs-table').innerHTML=html+'</tbody>';
    const matched = f.path.map(key => key.split(',').map(Number)).filter(([i,j]) => i > 0 && j > 0 && x[i-1] === y[j-1]);
    for (const [id, label, sequence, side, current] of [
      ['lcs-sequence-x','X',x,0,f.i], ['lcs-sequence-y','Y',y,1,f.j]
    ]) {
      const picked = new Set(matched.map(pair => pair[side]));
      byId(id).innerHTML = `<strong>${label}</strong>` + Array.from(sequence, (letter,index) => {
        const selected = picked.has(index+1);
        const active = index+1 === current && !f.message.startsWith('Complete:');
        return `<span class="lcs-letter${selected ? ' selected' : active ? ' current' : ''}"><b>${letter}</b><small>${index+1}</small></span>`;
      }).join('');
    }
    byId('lcs-choice').textContent=`X prefix: ${x.slice(0,f.i)||'∅'} · Y prefix: ${y.slice(0,f.j)||'∅'} · Recovered suffix: ${f.result||'—'}`;
    byId('lcs-message').textContent=f.message;
  });

  byId('lcs-play').closest('.lab').querySelector('.dp-legend').textContent = 'Amber: current state or prefix end · Violet: dependency · Outlined green cells: traceback · Green characters: recovered matches';

});
