/* Chapter 14 uses distinct keys. Order m means maximum children. */
(function (scope) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const node = (id, keys, children = [], extra = {}) => ({ id, keys, children, ...extra });
  const leaf = (id, keys, extra) => node(id, keys, [], extra);
  const flat = (keys, leaves) => node('root', keys, leaves.map((keys, i) => leaf('L' + i, keys)));
  const initialInsert = flat([35, 48, 60, 68], [[10,20], [40,45], [50,56,57,58], [62,65], [70,80]]);
  const insertOverflow = clone(initialInsert);
  insertOverflow.children[2].keys = [50,55,56,57,58];
  const insertPromoted = flat([35,48,56,60,68], [[10,20], [40,45], [50,55], [57,58], [62,65], [70,80]]);
  const insertFinal = node('root', [56], [node('A', [35,48], clone(insertPromoted.children.slice(0,3))), node('B', [60,68], clone(insertPromoted.children.slice(3)))]);
  const deletion = flat([5,10,50,80], [[3,4], [8,9], [20,28,29], [60,70], [85,90]]);
  const deficient = clone(deletion); deficient.keys = [5,9,50,80]; deficient.children[1].keys = [8];
  const borrowed = clone(deletion); borrowed.keys = [5,20,50,80]; borrowed.children[2].keys = [28,29];
  const mergeDeficient = clone(deletion); mergeDeficient.children[0].keys = [4];
  const merged = node('root', [10,50,80], [leaf('L0',[4,5,8,9]), ...clone(deletion.children.slice(2))]);
  const mway = node('root', [10,30,35], [leaf('C0',[2,5],{range:'k < 10'}),leaf('C1',[12,20,25],{range:'10 < k < 30'}),leaf('C2',[31,32,34],{range:'30 < k < 35'}),leaf('C3',[40,50],{range:'k > 35'})]);
  const bplus = node('root',[30,60],[leaf('L1',[5,10,20],{next:'L2'}),leaf('L2',[30,40,50],{next:'L3'}),leaf('L3',[60,70,80],{next:null})]);
  const index = node('R',[1,16],[node('I1',[1,6,11],[leaf('B1',[1,2,3,4,5]),leaf('B2',[6,7,8,9,10]),leaf('B3',[11,12,13,14,15])]),node('I2',[16,21,26],[leaf('B4',[16,17,18,19,20]),leaf('B5',[21,22,23,24,25]),leaf('B6',[26,27,28,29,30])])]);
  const order4 = node('root',[5],[node('A',[2],[leaf('L0',[1]),leaf('L1',[3,4])]),node('B',[9,12],[leaf('L2',[6]),leaf('L3',[10]),leaf('L4',[18,20,25])])]);
  const frame = (model, message, extra={}) => ({model, message, activeNodes:[], activeKeys:{}, allowedOverflow:[], allowedUnderflow:[], ...extra});
  const diagrams = {
    mway:{kind:'mway', order:4, frames:[
      frame(mway,'Search for 32. This node has three ordered keys and four distinct child-pointer slots.',{activeNodes:['root']}),
      frame(mway,'30 < 32 < 35, so use P2. Its arrow leads only to subtree C2.',{activeEdge:['root','C2']}),
      frame(mway,'Find 32 in C2. Every key in this subtree is strictly between 30 and 35.',{activeNodes:['C2'],activeKeys:{C2:[32]}}),
      frame(mway,'Separate equality example: search for 30. It is stored in the root, so stop here without following a child.',{activeNodes:['root'],activeKeys:{root:[30]}})
    ]},
    index:{kind:'index', frames:[
      frame(index,'Thirty sorted records occupy six data blocks, five records per block. Each index entry stores a minimum key and the page it points to.'),
      frame(index,'Search for 23: in root R, choose the largest entry key ≤ 23, which is 16. Follow its pointer to I2.',{activeEdge:['R','I2'],activeKeys:{R:[16]}}),
      frame(index,'In I2, choose entry 21 → B5 because 21 ≤ 23 < 26. Follow this entry’s pointer to B5.',{activeEdge:['I2','B5'],activeKeys:{I2:[21]}}),
      frame(index,'Read B5 and find record 23 among 21…25. With no cached pages, this path reads R, I2, and B5: three page reads.',{activeNodes:['B5'],activeKeys:{B5:[23]}})
    ]},
    insert:{kind:'btree',order:5, frames:[
      frame(initialInsert,'Search for 55: 48 < 55 < 60. Pointer P2 selects leaf L2 = [50,56,57,58].',{activeEdge:['root','L2']}),
      frame(insertOverflow,'Insert 55 in sorted order. L2 temporarily has five keys, one above the order-5 maximum of four.',{alertNodes:['L2'],activeKeys:{L2:[55]},allowedOverflow:['L2']}),
      frame(insertPromoted,'Split L2 around 56: [50,55] and [57,58]. Move key 56 and its record pointer to the parent. The parent now has five keys and six children.',{alertNodes:['root'],activeKeys:{root:[56]},allowedOverflow:['root']}),
      frame(insertFinal,'Split the overflowing root around 56. A new root holds 56. Its two children each have two keys and three children; all six leaves remain at the same depth.',{activeNodes:['root'],activeKeys:{root:[56]}})
    ]},
    delete:{kind:'btree',order:5, frames:[
      frame(deletion,'Delete internal key 10. Its predecessor is 9, the largest key in its left child L1. Replace 10 using that entry.',{activeNodes:['root','L1'],activeKeys:{root:[10],L1:[9]}}),
      frame(deficient,'After moving 9 to the root and deleting it from L1, leaf [8] has only one key. It underflows: non-root nodes require at least two keys.',{alertNodes:['L1'],activeKeys:{root:[9]},allowedUnderflow:['L1']}),
      frame(borrowed,'Borrow through the parent: separator 9 moves down to L1, and sibling key 20 moves up. L1 = [8,9] and L2 = [28,29] now meet the minimum.',{activeNodes:['L1','L2'],activeKeys:{root:[20],L1:[9]}})
    ]},
    merge:{kind:'btree',order:5, frames:[
      frame(deletion,'Independent example, starting from the original tree: delete 3 from L0 = [3,4].',{activeNodes:['L0'],activeKeys:{L0:[3]}}),
      frame(mergeDeficient,'L0 becomes [4] and underflows. Its only adjacent sibling L1 = [8,9] is at the minimum, so it cannot lend.',{alertNodes:['L0'],activeNodes:['L1'],allowedUnderflow:['L0']}),
      frame(merged,'Merge [4], parent separator 5, and [8,9] into [4,5,8,9]. Remove separator 5 and one child pointer from the root. The root now has three keys and four children.',{activeNodes:['root','L0'],activeKeys:{L0:[5]}})
    ]},
    bplus:{kind:'bplus',order:3,leafCapacity:3, frames:[
      frame(bplus,'Internal keys 30 and 60 are routing copies. Leaf cells contain the data entries: a key above its record pointer r(key). Purple arrows connect next-leaf slots.'),
      frame(bplus,'Search for 50: 30 ≤ 50 < 60. Use P1 to reach L2.',{activeEdge:['root','L2']}),
      frame(bplus,'Find 50 in L2 and use r50 to locate its record. Internal separators have no record pointers.',{activeNodes:['L2'],activeKeys:{L2:[50]}}),
      frame(bplus,'For the inclusive range [50,80], output 50, then follow L2’s next slot to L3. This is a leaf link, not a child pointer.',{activeLeafLink:['L2','L3'],activeKeys:{L2:[50]}}),
      frame(bplus,'Continue with 60, 70, and 80 in L3. Its next slot is null (∅), marking the end of the linked leaf sequence.',{activeNodes:['L3'],activeKeys:{L3:[60,70,80]}}),
      frame(bplus,'Equality example: search for 30. At the root, equality follows P1 to L2; the record entry for 30 remains in the leaf.',{activeEdge:['root','L2'],activeKeys:{root:[30],L2:[30]}})
    ]},
    order4:{kind:'btree',order:4,frames:[frame(order4,'Final tree after inserting 2,5,10,1,6,9,4,3,12,18,20,25 using top-down splitting of full nodes before descent.')]}
  };

  /* Layout is measured from the actual cells; it never guesses edges from key count or source order. */
  function layout(model,kind){
    const nodes=[],edges=[],leafLinks=[],byId={};
    const gap = kind==='index'?24:38, levelGap=190;
    function measure(n,depth){
      const internal=n.children.length>0, paired=kind==='btree'||(kind==='bplus'&&!internal);
      const keyW=kind==='index'?26:48, pointerW=30;
      let width,ports=[],keyCells=[],nextPort=null;
      if(kind==='index'&&internal){
        width=n.keys.length*66;
        n.keys.forEach((key,i)=>{keyCells.push({key,x:i*66,width:66});ports.push({x:i*66+33,label:n.children[i].id});});
      }else if(internal){
        width=n.keys.length*keyW+(n.keys.length+1)*pointerW;
        for(let i=0;i<=n.keys.length;i++)ports.push({x:i*(pointerW+keyW)+pointerW/2,label:'P'+i});
        n.keys.forEach((key,i)=>keyCells.push({key,x:pointerW+i*(pointerW+keyW),width:keyW}));
      }else{
        width=n.keys.length*keyW+(kind==='bplus'?48:0);
        n.keys.forEach((key,i)=>keyCells.push({key,x:i*keyW,width:keyW}));
        if(kind==='bplus')nextPort={x:width-24,label:n.next||'∅'};
      }
      const height=paired||(kind==='index'&&internal)?62:42;
      const children=n.children.map(child=>measure(child,depth+1));
      const childrenWidth=children.reduce((sum,c)=>sum+c.span,0)+Math.max(0,children.length-1)*gap;
      return {source:n,depth,width,height,ports,keyCells,nextPort,paired,children,span:Math.max(width+16,childrenWidth,n.range?160:0)};
    }
    const root=measure(model,0), width=Math.max(560,root.span+64);
    function position(item,left){
      item.x=left+item.span/2-item.width/2;item.y=56+item.depth*levelGap;
      nodes.push(item);byId[item.source.id]=item;
      let childLeft=left+(item.span-(item.children.reduce((s,c)=>s+c.span,0)+Math.max(0,item.children.length-1)*gap))/2;
      item.children.forEach((child,i)=>{
        position(child,childLeft); childLeft+=child.span+gap;
        edges.push({from:item.source.id,to:child.source.id,slot:i,start:{x:item.x+item.ports[i].x,y:item.y+item.height},end:{x:child.x+child.width/2,y:child.y-5}});
      });
    }
    position(root,(width-root.span)/2);
    nodes.filter(n=>n.nextPort&&n.source.next).forEach(n=>{const target=byId[n.source.next];leafLinks.push({from:n.source.id,to:n.source.next,start:{x:n.x+n.nextPort.x,y:n.y+n.height},end:{x:target.x+12,y:target.y+target.height+5},lane:n.y+n.height+42});});
    return {width,height:Math.max(...nodes.map(n=>n.y+n.height))+100,nodes,edges,leafLinks};
  }
  function describe(n,kind){
    const keys=n.keys.join(', ');let text=n.id+': ['+keys+']';
    if(n.children.length)text+='; '+n.children.map((c,i)=>(kind==='index'?n.keys[i]+' → ': 'P'+i+' → ')+c.id).join('; ');
    else if(kind==='bplus')text+='; next → '+(n.next||'null');
    return text+(n.children.length?'\n'+n.children.map(c=>describe(c,kind)).join('\n'):'');
  }
  function draw(svg,definition,state){
    const NS='http://www.w3.org/2000/svg',l=layout(state.model,definition.kind),prefix=svg.id;
    svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${l.width} ${l.height}`);
    svg.style.width=l.width+'px';svg.style.height=l.height+'px';svg.setAttribute('aria-describedby',prefix+'-description');
    function add(tag,attrs={},text,parent=svg){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;parent.appendChild(el);return el;}
    add('title',{},svg.getAttribute('aria-label'));
    add('desc',{id:prefix+'-description'},state.message+'\n'+describe(state.model,definition.kind));
    const defs=add('defs');
    [['child','#0b7285'],['active','#b45309'],['next','#6d4cc3']].forEach(([name,color])=>{const marker=add('marker',{id:prefix+'-'+name,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto',markerUnits:'userSpaceOnUse'},undefined,defs);add('path',{d:'M 0 0 L 10 5 L 0 10 Z',fill:color},undefined,marker);});
    const matches=(pair,e)=>pair&&pair[0]===e.from&&pair[1]===e.to;
    l.edges.forEach(e=>{const selected=matches(state.activeEdge,e),color=selected?'#b45309':'#0b7285';add('path',{'data-from':e.from,'data-to':e.to,'data-slot':e.slot,d:`M ${e.start.x} ${e.start.y} L ${e.start.x} ${e.start.y+15} L ${e.end.x} ${e.end.y}`,fill:'none',stroke:color,'stroke-width':selected?3.5:1.8,'marker-end':`url(#${prefix}-${selected?'active':'child'})`});});
    l.leafLinks.forEach(e=>{const selected=matches(state.activeLeafLink,e);add('path',{'data-leaf-from':e.from,'data-leaf-to':e.to,d:`M ${e.start.x} ${e.start.y} V ${e.lane} H ${e.end.x} V ${e.end.y}`,fill:'none',stroke:selected?'#b45309':'#6d4cc3','stroke-width':selected?3.5:2,'stroke-dasharray':'6 4','marker-end':`url(#${prefix}-${selected?'active':'next'})`});});
    l.nodes.forEach(n=>{
      const id=n.source.id,selected=state.activeNodes.includes(id),bad=(state.alertNodes||[]).includes(id),internal=n.children.length>0;
      const g=add('g',{'data-node':id});
      add('text',{x:internal&&id!=='root'?n.x+4:n.x+n.width/2,y:internal?n.y-14:n.y+n.height+22,class:'tree-node-label','text-anchor':internal&&id!=='root'?'start':'middle'},n.source.range?id+' · '+n.source.range:id==='root'?'Root':id,g);
      add('rect',{x:n.x,y:n.y,width:n.width,height:n.height,rx:4,fill:bad?'#fff0eb':selected?'#fdf1df':'#fff',stroke:bad?'#c2410c':selected?'#b45309':'#52617a','stroke-width':bad||selected?2.5:1.5},undefined,g);
      n.keyCells.forEach(cell=>{
        const x=n.x+cell.x,highlight=(state.activeKeys[id]||[]).includes(cell.key);
        if(highlight)add('rect',{x:x+1,y:n.y+1,width:cell.width-2,height:n.height-2,fill:'#fef0ce'},undefined,g);
        if(cell.x)add('path',{d:`M ${x} ${n.y} v ${n.height}`,stroke:'#bcc8d8'},undefined,g);
        if(internal&&definition.kind!=='index')add('path',{d:`M ${x+cell.width} ${n.y} v ${n.height}`,stroke:'#bcc8d8'},undefined,g);
        add('text',{x:x+cell.width/2,y:n.y+(n.paired||definition.kind==='index'&&internal?20:24),class:'tree-key'},cell.key,g);
        if(n.paired||definition.kind==='index'&&internal){add('path',{d:`M ${x} ${n.y+33} h ${cell.width}`,stroke:'#dbe4f0'},undefined,g);add('text',{x:x+cell.width/2,y:n.y+49,class:'tree-record'},definition.kind==='index'?n.source.children[n.keyCells.indexOf(cell)].id:'r'+cell.key,g);}
      });
      if(internal&&definition.kind!=='index')n.ports.forEach(port=>add('text',{x:n.x+port.x,y:n.y+n.height/2+4,class:'tree-pointer'},port.label,g));
      if(n.nextPort){const x=n.x+n.width-48;add('path',{d:`M ${x} ${n.y} v ${n.height}`,stroke:'#bcc8d8'},undefined,g);add('text',{x:n.x+n.nextPort.x,y:n.y+20,class:'tree-pointer'},'next',g);add('text',{x:n.x+n.nextPort.x,y:n.y+49,class:'tree-next'},n.nextPort.label,g);}
      n.ports.forEach(port=>add('circle',{cx:n.x+port.x,cy:n.y+n.height,r:3,fill:'#0b7285'},undefined,g));
      if(n.nextPort)add('circle',{cx:n.x+n.nextPort.x,cy:n.y+n.height,r:3,fill:'#6d4cc3'},undefined,g);
    });
    const text=document.getElementById(prefix+'-text');if(text)text.textContent=describe(state.model,definition.kind);
  }
  function initialize(){
    for(const [id,definition] of Object.entries(diagrams)){
      const svg=document.getElementById(id+'-diagram');if(!svg)continue;
      const zoom=document.getElementById(id+'-zoom');
      if(zoom)zoom.addEventListener('click',()=>{const expanded=svg.parentElement.classList.toggle('expanded');zoom.textContent=expanded?'Fit whole diagram':'Enlarge';zoom.setAttribute('aria-pressed',String(expanded));});
      if(id==='order4'){draw(svg,definition,definition.frames[0]);continue;}
      scope.ChapterUI.player({frames:definition.frames,play:id+'-play',step:id+'-step',reset:id+'-reset',speed:id+'-speed',status:id+'-status',render(state){draw(svg,definition,state);document.getElementById(id+'-message').textContent=state.message;}});
    }
  }
  scope.Chapter14={diagrams,layout,describe,draw};
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',initialize);
})(typeof window!=='undefined'?window:globalThis);
