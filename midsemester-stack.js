(function () {
    var root = document.getElementById("recursive-reverse-trace");
    if (!root) return;

    function stackFrame(name, prev, cur, state, resume) {
      return {name:name, prev:prev, cur:cur, state:state, resume:resume};
    }

    var f1Start = stackFrame("F1", "NULL", "node 1", "active", "next: line 2");
    var f1Call = stackFrame("F1", "NULL", "node 1", "calling F2", "next: line 3");
    var f1Wait = stackFrame("F1", "NULL", "node 1", "waiting", "resume: line 4");
    var f2Start = stackFrame("F2", "node 1", "node 2", "active", "next: line 2");
    var f2Call = stackFrame("F2", "node 1", "node 2", "calling F3", "next: line 3");
    var f2Wait = stackFrame("F2", "node 1", "node 2", "waiting", "resume: line 4");
    var f3Start = stackFrame("F3", "node 2", "node 3", "active", "next: line 2");
    var f3Call = stackFrame("F3", "node 2", "node 3", "calling F4", "next: line 3");
    var f3Wait = stackFrame("F3", "node 2", "node 3", "waiting", "resume: line 4");
    var f4Start = stackFrame("F4", "node 3", "NULL", "active", "next: line 2");
    var f4Else = stackFrame("F4", "node 3", "NULL", "base case", "next: line 5");
    var f4Head = stackFrame("F4", "node 3", "NULL", "base case", "next: line 6");

    var frames = [
      {line:2, prev:"NULL", cur:"node 1", nextLine:"line 2", list:"1 → 2 → 3 → NULL", stack:[f1Start], message:"Line 7 calls reverse(NULL, node 1). Frame F1 is pushed; line 2 executes next."},
      {line:3, prev:"NULL", cur:"node 1", nextLine:"line 3", list:"1 → 2 → 3 → NULL", stack:[f1Call], message:"F1 evaluates cur as true. Line 3 will call reverse(node 1, node 2). No link has changed yet."},
      {line:2, prev:"node 1", cur:"node 2", nextLine:"line 2", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Start], message:"F1 executes line 3 and pauses there. F2 is pushed with prev=node 1 and cur=node 2; line 2 executes next."},
      {line:3, prev:"node 1", cur:"node 2", nextLine:"line 3", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Call], message:"F2 evaluates cur as true. Line 3 will call reverse(node 2, node 3). F1 remains suspended below F2."},
      {line:2, prev:"node 2", cur:"node 3", nextLine:"line 2", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Wait,f3Start], message:"F2 executes line 3 and pauses. F3 is pushed with prev=node 2 and cur=node 3; line 2 executes next."},
      {line:3, prev:"node 2", cur:"node 3", nextLine:"line 3", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Wait,f3Call], message:"F3 evaluates cur as true. Because node 3.next is NULL, line 3 will call reverse(node 3, NULL)."},
      {line:2, prev:"node 3", cur:"NULL", nextLine:"line 2", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Wait,f3Wait,f4Start], message:"F3 executes line 3 and pauses. Base-case frame F4 is pushed with prev=node 3 and cur=NULL."},
      {line:5, prev:"node 3", cur:"NULL", nextLine:"line 5", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Wait,f3Wait,f4Else], message:"F4 evaluates cur as false, so the if-body is skipped and the else branch on line 5 executes next."},
      {line:6, prev:"node 3", cur:"NULL", nextLine:"line 6", list:"1 → 2 → 3 → NULL", stack:[f1Wait,f2Wait,f3Wait,f4Head], message:"F4 enters the else branch. Line 6 will assign node 3 to head; the links are still unchanged."},
      {line:4, prev:"node 2", cur:"node 3", nextLine:"line 4", list:"new head established: head → 3", stack:[f1Wait,f2Wait,stackFrame("F3","node 2","node 3","resumed","next: line 4")], message:"F4 executes head = node 3 and returns implicitly. F4 is popped. F3 resumes after its line 3 call; line 4 executes next."},
      {line:4, prev:"node 1", cur:"node 2", nextLine:"line 4", list:"new chain: head → 3 → 2", stack:[f1Wait,stackFrame("F2","node 1","node 2","resumed","next: line 4")], message:"F3 executes 3.next = node 2 and returns. F3 is popped. The new chain now begins 3 → 2; F2 executes line 4 next."},
      {line:4, prev:"NULL", cur:"node 1", nextLine:"line 4", list:"new chain: head → 3 → 2 → 1", stack:[stackFrame("F1","NULL","node 1","resumed","next: line 4")], message:"F2 executes 2.next = node 1 and returns. F2 is popped. The new chain is now 3 → 2 → 1; F1 executes line 4 next."},
      {line:7, prev:"—", cur:"—", nextLine:"after line 7", list:"head → 3 → 2 → 1 → NULL", stack:[], message:"F1 executes 1.next = NULL and returns. F1 is popped. The final node now terminates the reversed list."}
    ];

    var rows = Array.prototype.slice.call(root.querySelectorAll(".trace-code-row"));
    var listState = document.getElementById("rec-list-state");
    var prevValue = document.getElementById("rec-prev");
    var curValue = document.getElementById("rec-cur");
    var nextLineValue = document.getElementById("rec-next-line");
    var message = document.getElementById("rec-message");
    var stack = document.getElementById("rec-stack");
    var stackEvent = document.getElementById("rec-stack-event");
    var linkHead = document.getElementById("rec-link-head");
    var linkNode3 = document.getElementById("rec-link-node-3");
    var linkNode2 = document.getElementById("rec-link-node-2");
    var linkNode1 = document.getElementById("rec-link-node-1");
    var link32 = document.getElementById("rec-link-32");
    var link21 = document.getElementById("rec-link-21");
    var link1n = document.getElementById("rec-link-1n");
    var linkNull = document.getElementById("rec-link-null");
    var linkWrite = document.getElementById("rec-link-write");
    var linkCaption = document.getElementById("rec-link-caption");
    var counter = document.getElementById("rec-step-count");
    var play = document.getElementById("rec-play");
    var stepButton = document.getElementById("rec-step");
    var reset = document.getElementById("rec-reset");
    var position = 0;
    var timer = null;
    var stackEvents = {
      0: {text:"PUSH F1 · reverse(NULL, node 1)", kind:"push"},
      2: {text:"PUSH F2 · reverse(node 1, node 2)", kind:"push"},
      4: {text:"PUSH F3 · reverse(node 2, node 3)", kind:"push"},
      6: {text:"PUSH F4 · reverse(node 3, NULL)", kind:"push"},
      9: {text:"POP F4 · head becomes node 3", kind:"pop"},
      10: {text:"POP F3 · after 3.next = node 2", kind:"pop"},
      11: {text:"POP F2 · after 2.next = node 1", kind:"pop"},
      12: {text:"POP F1 · after 1.next = NULL", kind:"pop"}
    };
    var linkStages = [
      {write:"No reverse link yet", caption:"The recursive calls are still moving toward the base case; no reverse link has been written."},
      {write:"head = node 3", caption:"The base-case frame establishes node 3 as the new head."},
      {write:"3.next = node 2", caption:"F3 resumes and establishes the first reversed link: node 3 points to node 2."},
      {write:"2.next = node 1", caption:"F2 resumes and extends the new chain from node 2 to node 1."},
      {write:"1.next = NULL", caption:"F1 resumes and terminates the new chain. Reversal is complete."}
    ];

    function render() {
      var frame = frames[position];
      rows.forEach(function (row) {
        row.classList.toggle("active", Number(row.getAttribute("data-rec-line")) === frame.line);
      });
      listState.textContent = frame.list;
      prevValue.textContent = frame.prev;
      curValue.textContent = frame.cur;
      nextLineValue.textContent = frame.nextLine;
      message.textContent = frame.message;
      counter.textContent = "Step " + (position + 1) + " of " + frames.length;
      var displayFrames = frame.stack.slice().reverse();
      stack.innerHTML = displayFrames.length ? displayFrames.map(function (item, index) {
        var stateClass = item.state.indexOf("waiting") >= 0 ? " waiting" :
          (item.state.indexOf("resumed") >= 0 ? " returning" : "");
        return '<div class="rec-frame ' + (index === 0 ? 'active' : '') + stateClass + '">' +
          (index === 0 ? '<span class="rec-top-pointer">TOP →</span>' : '') +
          '<span class="rec-frame-title"><b>' + item.name +
          '</b><span>' + item.state + '</span></span>' +
          '<code>prev=' + item.prev + '</code><code>cur=' + item.cur +
          '</code><small>' + item.resume + '</small></div>';
      }).join("") : '<div class="rec-stack-empty">reverse() stack is empty<br>control returned to the caller</div>';
      var event = stackEvents[position];
      stackEvent.textContent = event ? event.text : "TOP frame executes line " + frame.line;
      stackEvent.className = "rec-stack-event " + (event ? event.kind : "");
      var linkPhase = position < 9 ? 0 : position - 8;
      var linkStage = linkStages[linkPhase];
      linkHead.classList.toggle("established", linkPhase >= 1);
      linkNode3.classList.toggle("established", linkPhase >= 1);
      link32.classList.toggle("established", linkPhase >= 2);
      linkNode2.classList.toggle("established", linkPhase >= 2);
      link21.classList.toggle("established", linkPhase >= 3);
      linkNode1.classList.toggle("established", linkPhase >= 3);
      link1n.classList.toggle("established", linkPhase >= 4);
      linkNull.classList.toggle("established", linkPhase >= 4);
      linkWrite.textContent = linkStage.write;
      linkCaption.textContent = linkStage.caption;
      stepButton.disabled = position === frames.length - 1;
      play.textContent = timer ? "Pause" : (position === frames.length - 1 ? "Replay" : "Play");
    }

    function stop() {
      if (timer) window.clearTimeout(timer);
      timer = null;
      render();
    }

    function run() {
      if (position === frames.length - 1) position = 0;
      timer = window.setTimeout(function advance() {
        if (position < frames.length - 1) {
          position += 1;
          render();
          timer = window.setTimeout(advance, 1150);
        } else {
          stop();
        }
      }, 700);
      render();
    }

    play.addEventListener("click", function () { timer ? stop() : run(); });
    stepButton.addEventListener("click", function () {
      stop();
      if (position < frames.length - 1) position += 1;
      render();
    });
    reset.addEventListener("click", function () { stop(); position = 0; render(); });
    render();
  }());
