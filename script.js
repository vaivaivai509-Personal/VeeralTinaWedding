/* Veeral's cocktail invitation. No framework, network API or build step required. */
(() => {
  'use strict';
  const EVENT_START = new Date('2026-11-28T19:00:00+05:30').getTime();
  const $ = id => document.getElementById(id);
  const body = document.body;
  const main = $('invitation');
  const opening = $('opening');
  const music = $('party-music');
  const chapters = $('party-chapters');
  const night = $('the-night');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  let opened = false;
  let revealed = false;
  let lightsOn = false;
  let resumeMusic = false;
  let countdownInterval;
  let toastTimeout;
  let effectsReady = false;
  let ignitionTimeout;
  main.inert = true;
  $('topbar').inert = true;
  chapters.hidden = true;
  chapters.inert = true;
  music.volume = 0.55;

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 4200);
  }

  function syncMusic() {
    const playing = !music.paused && !music.ended;
    $('music-toggle').classList.toggle('is-playing', playing);
    $('music-toggle').setAttribute('aria-pressed', String(playing));
    $('music-toggle').setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    $('music-label').textContent = playing ? 'Sound on' : 'Sound off';
  }

  function playMusic() {
    const attempt = music.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        syncMusic();
        if (opened) toast('Tap Sound off to start the music.');
      });
    }
  }
  ['play', 'pause', 'ended'].forEach(name => music.addEventListener(name, syncMusic));
  music.addEventListener('error', () => {
    syncMusic();
    if (opened) toast('Music could not load. Keep the assets folder beside index.html.');
  });
  $('music-toggle').addEventListener('click', () => {
    if (music.paused) playMusic();
    else { music.pause(); resumeMusic = false; }
  });

  function syncMotion() {
    body.classList.toggle('motion-paused', reducedMotion);
    document.documentElement.style.scrollBehavior = reducedMotion ? 'auto' : 'smooth';
    $('motion-toggle').setAttribute('aria-pressed', String(!reducedMotion));
    $('motion-toggle').setAttribute('aria-label', reducedMotion ? 'Resume decorative motion' : 'Pause decorative motion');
    $('motion-label').textContent = reducedMotion ? 'Motion off' : 'Motion on';
    if (effectsReady) reconcilePartyAnimation();
  }
  syncMotion();
  $('motion-toggle').addEventListener('click', () => { reducedMotion = !reducedMotion; syncMotion(); });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', event => { reducedMotion = event.matches; syncMotion(); });

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.09, rootMargin: '0px 0px -18px 0px'}) : null;
  document.querySelectorAll('.reveal').forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('in-view');
  });

  // Open from a real tap/click so mobile browsers can also start the soundtrack.
  $('open-bottle').addEventListener('click', () => {
    if (opened) return;
    opened = true;
    $('open-bottle').disabled = true;
    playMusic();
    opening.classList.add('is-opening');
    body.classList.add('bursting');
    startFizz();
    const revealAt = reducedMotion ? 260 : 1040;
    setTimeout(() => {
      body.classList.add('is-open');
      body.classList.remove('is-locked');
      main.inert = false;
      $('topbar').inert = false;
      opening.classList.add('gone');
      window.scrollTo({top:0, behavior:'instant'});
      $('hero-title').setAttribute('tabindex', '-1');
      $('hero-title').focus({preventScroll:true});
      $('hero-title').style.outline = 'none';
    }, revealAt);
    setTimeout(() => {
      opening.hidden = true;
      body.classList.remove('bursting');
    }, reducedMotion ? 900 : 2300);
  });

  // Scratch surface is drawn locally: it works from file:// and has no CORS dependency.
  const scratch = $('scratch-card');
  const scratchContext = scratch.getContext('2d', {willReadFrequently:true});
  let scratchWidth = 0, scratchHeight = 0, scratchDpr = 1;
  let scratching = false, hasScratched = false, lastPoint = null, strokes = 0;
  function paintScratch(preserve = false) {
    if (!scratchContext || revealed) return;
    const rect = scratch.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    let oldCanvas = null;
    if (preserve && hasScratched) {
      oldCanvas = document.createElement('canvas');
      oldCanvas.width = scratch.width;
      oldCanvas.height = scratch.height;
      oldCanvas.getContext('2d').drawImage(scratch,0,0);
    }
    scratchWidth = rect.width;
    scratchHeight = rect.height;
    scratchDpr = Math.min(window.devicePixelRatio || 1,2);
    scratch.width = Math.round(scratchWidth * scratchDpr);
    scratch.height = Math.round(scratchHeight * scratchDpr);
    scratchContext.setTransform(scratchDpr,0,0,scratchDpr,0,0);
    scratchContext.globalCompositeOperation = 'source-over';
    if (oldCanvas) {
      scratchContext.drawImage(oldCanvas,0,0,oldCanvas.width,oldCanvas.height,0,0,scratchWidth,scratchHeight);
      return;
    }
    const gold = scratchContext.createLinearGradient(0,0,scratchWidth,scratchHeight);
    gold.addColorStop(0,'#9b6d35'); gold.addColorStop(.23,'#f7dfae');
    gold.addColorStop(.49,'#ce9c50'); gold.addColorStop(.72,'#f2d091'); gold.addColorStop(1,'#b5823d');
    scratchContext.fillStyle = gold;
    scratchContext.fillRect(0,0,scratchWidth,scratchHeight);
    for (let i=0;i<170;i++) {
      scratchContext.fillStyle = i%2 ? '#fff7da33' : '#5030081a';
      scratchContext.fillRect((i*43.37)%scratchWidth,(i*17.83)%scratchHeight,1,1);
    }
    scratchContext.strokeStyle = '#fff3c27a';
    scratchContext.strokeRect(5,5,scratchWidth-10,scratchHeight-10);
    scratchContext.fillStyle = '#372512';
    scratchContext.textAlign = 'center';
    scratchContext.textBaseline = 'middle';
    scratchContext.font = 'bold 12px Evening, Arial, sans-serif';
    scratchContext.fillText('SCRATCH TO REVEAL',scratchWidth/2,scratchHeight/2-6);
    scratchContext.font = '10px Evening, Arial, sans-serif';
    scratchContext.fillText('a date worth celebrating',scratchWidth/2,scratchHeight/2+12);
  }
  function pointOf(event) {
    const rect = scratch.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  }
  function erase(point) {
    if (!scratchContext) return;
    scratchContext.globalCompositeOperation = 'destination-out';
    scratchContext.lineWidth = 30;
    scratchContext.lineCap = 'round';
    scratchContext.lineJoin = 'round';
    scratchContext.beginPath();
    scratchContext.moveTo(lastPoint ? lastPoint.x : point.x, lastPoint ? lastPoint.y : point.y);
    scratchContext.lineTo(point.x,point.y);
    scratchContext.stroke();
    scratchContext.beginPath();
    scratchContext.arc(point.x,point.y,15,0,Math.PI*2);
    scratchContext.fill();
    lastPoint = point;
    hasScratched = true;
    strokes++;
    if (strokes%5===0) checkScratch();
  }
  function checkScratch() {
    if (!scratchContext || revealed || !hasScratched) return;
    const pixels = scratchContext.getImageData(0,0,scratch.width,scratch.height).data;
    let clear = 0, sampled = 0;
    for (let i=3;i<pixels.length;i+=32) { sampled++; if (pixels[i]<64) clear++; }
    if (clear/sampled > .34) revealDate();
  }
  scratch.addEventListener('pointerdown',event => {
    if (revealed) return;
    event.preventDefault();
    scratching = true; lastPoint = null;
    try { scratch.setPointerCapture(event.pointerId); } catch (_) { /* Older browser fallback. */ }
    erase(pointOf(event));
  });
  scratch.addEventListener('pointermove',event => { if (scratching && !revealed) { event.preventDefault(); erase(pointOf(event)); } });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => scratch.addEventListener(name,() => {
    scratching = false; lastPoint = null; checkScratch();
  }));
  scratch.addEventListener('keydown',event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); revealDate(); }
  });
  $('reveal-date').addEventListener('click',revealDate);

  function updateCountdown() {
    let remaining = Math.max(0, Math.floor((EVENT_START-Date.now())/1000));
    const days = Math.floor(remaining/86400); remaining %= 86400;
    const hours = Math.floor(remaining/3600); remaining %= 3600;
    const minutes = Math.floor(remaining/60);
    const seconds = remaining%60;
    [['days',days],['hours',hours],['minutes',minutes],['seconds',seconds]].forEach(([id,value]) => { $(id).textContent = String(value).padStart(2,'0'); });
    $('countdown').setAttribute('aria-label',`${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds until the party`);
    if (Date.now() >= EVENT_START) {
      $('countdown-caption').textContent = 'It’s time to celebrate!';
      clearInterval(countdownInterval);
    }
  }
  function revealDate() {
    if (revealed) return;
    revealed = true;
    scratching = false;
    scratch.tabIndex = -1;
    $('reserve-stage').classList.add('is-revealed');
    $('scratch-instruction').textContent = 'Keep this evening for us.';
    $('reserve-title').innerHTML = 'It’s officially<br><em>a date.</em>';
    $('reveal-date').style.visibility = 'hidden';
    $('chapter-gate-note').textContent = 'A little sparkle. Your night is opening…';
    startBoxSplash();
    $('date-reveal').classList.add('shown');
    $('date-reveal').setAttribute('aria-hidden','false');
    countdownInterval = setInterval(updateCountdown,1000);
    updateCountdown();
    // Removing later chapters from layout makes the scroll gate work with
    // touch, wheel, keyboard, the scrollbar and direct anchor links alike.
    setTimeout(() => {
      chapters.hidden = false;
      chapters.inert = false;
      body.classList.add('chapters-unlocked');
      $('next-details').hidden = false;
      $('chapter-gate-note').textContent = 'The night is unlocked. Keep scrolling.';
      resizePartyScene();
    }, reducedMotion ? 180 : 1700);
    // If a keyboard activation removes the focused control, move focus to the result.
    if (document.activeElement === scratch || document.activeElement === $('reveal-date')) {
      $('revealed-date').setAttribute('tabindex','-1');
      $('revealed-date').focus({preventScroll:true});
      $('revealed-date').style.outline = 'none';
    }
  }
  paintScratch();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!hasScratched) paintScratch(); });

  $('lights-toggle').addEventListener('click',() => {
    if (chapters.hidden) return;
    lightsOn = !lightsOn;
    $('dance-stage').classList.toggle('party-on',lightsOn);
    night.classList.toggle('party-on',lightsOn);
    clearTimeout(ignitionTimeout);
    night.classList.remove('party-start');
    if (lightsOn) {
      resizePartyScene();
      // Restart the switch-on bloom even after a quick off/on toggle.
      void night.offsetWidth;
      night.classList.add('party-start');
      ignitionTimeout = setTimeout(() => night.classList.remove('party-start'),2200);
      seedPartyConfetti();
    }
    reconcilePartyAnimation();
    $('lights-toggle').setAttribute('aria-pressed',String(lightsOn));
    $('lights-label').textContent = lightsOn ? 'Turn off the party lights' : 'Turn on the party lights';
    $('dance-status').textContent = lightsOn ? 'The dance floor is yours' : 'Every good night needs a little disco';
    $('dance-hint').textContent = lightsOn ? 'A little sparkle looks good on you.' : 'Tap. Sparkle. Own the dance floor.';
  });

  // Canvas splash around the box. No extra downloads or video are needed.
  const boxCanvas = $('box-splash');
  const boxContext = boxCanvas.getContext('2d');
  let boxFrame = 0;
  function startBoxSplash() {
    if (!boxContext || reducedMotion) return;
    if (boxFrame) cancelAnimationFrame(boxFrame);
    const bounds = boxCanvas.getBoundingClientRect();
    const width = bounds.width, height = bounds.height;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1,1.5);
    boxCanvas.width = Math.round(width*dpr); boxCanvas.height = Math.round(height*dpr);
    boxContext.setTransform(dpr,0,0,dpr,0,0);
    const x = width*.5, y = height*.7;
    const count = innerWidth<600 ? 130 : 210;
    const splash = Array.from({length:count},(_,i) => {
      const side = i%2 ? -1 : 1;
      const angle = -Math.PI/2+side*(.25+Math.random()*1.05);
      const speed = 5+Math.random()*8;
      return {x:x+side*width*.06,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        size:1.4+Math.random()*4,spin:Math.random()*Math.PI,rotation:(Math.random()-.5)*.15,
        delay:200+Math.random()*530,kind:i%5,colour:['#fff0bd','#ebc371','#dca574','#cba2dc'][i%4]};
    });
    boxCanvas.classList.add('is-active');
    const start = performance.now(); let previous = start;
    function draw(now) {
      boxFrame = 0;
      const elapsed=now-start, delta=Math.min((now-previous)/16.67,2); previous=now;
      boxContext.clearRect(0,0,width,height);
      if (reducedMotion || document.hidden || elapsed>3800) {
        boxCanvas.classList.remove('is-active'); return;
      }
      // Two curved champagne streams break into the falling droplets.
      const stream=Math.max(0,Math.min(1,(elapsed-200)/850));
      if (stream>0 && elapsed<1600) {
        boxContext.globalAlpha=Math.max(0,Math.sin(stream*Math.PI)*.5)*(elapsed<1150?1:(1600-elapsed)/450);
        boxContext.strokeStyle='#ffe7a5'; boxContext.lineWidth=3.5; boxContext.lineCap='round';
        for (const side of [-1,1]) {
          boxContext.beginPath();boxContext.moveTo(x+side*width*.035,y);
          boxContext.bezierCurveTo(x+side*width*.07,y-height*.43*stream,x+side*width*.33*stream,y-height*.55*stream,x+side*width*.41*stream,y-height*.11*stream);
          boxContext.stroke();
        }
      }
      for (const drop of splash) {
        if (elapsed<drop.delay) continue;
        drop.x+=drop.vx*delta;drop.y+=drop.vy*delta;drop.vy+=.16*delta;drop.vx*=.996;
        drop.spin+=drop.rotation*delta;
        boxContext.globalAlpha=Math.max(0,1-(elapsed-drop.delay)/2900)*.9;
        boxContext.fillStyle=drop.colour;boxContext.strokeStyle=drop.colour;
        if (drop.kind===0) {
          boxContext.save();boxContext.translate(drop.x,drop.y);boxContext.rotate(drop.spin);
          boxContext.fillRect(-drop.size/2,-drop.size,drop.size,drop.size*2.5);boxContext.restore();
        } else if (drop.kind===1) {
          drawGlint(boxContext,drop.x,drop.y,drop.size*1.6);
        } else {
          boxContext.beginPath();boxContext.ellipse(drop.x,drop.y,drop.size*.75,drop.size*1.3,Math.atan2(drop.vy,drop.vx)+Math.PI/2,0,Math.PI*2);
          if (drop.kind===2) {boxContext.lineWidth=.9;boxContext.stroke();} else boxContext.fill();
        }
      }
      boxContext.globalAlpha=1;
      boxFrame=requestAnimationFrame(draw);
    }
    boxFrame=requestAnimationFrame(draw);
  }

  function drawGlint(context,x,y,size) {
    context.beginPath();context.moveTo(x,y-size);context.lineTo(x+size*.18,y-size*.18);
    context.lineTo(x+size,y);context.lineTo(x+size*.18,y+size*.18);context.lineTo(x,y+size);
    context.lineTo(x-size*.18,y+size*.18);context.lineTo(x-size,y);context.lineTo(x-size*.18,y-size*.18);
    context.closePath();context.fill();
  }

  // All party effects share the whole venue scene, so light crosses its centre.
  const partyCanvas=$('party-sparkles');
  const partyContext=partyCanvas.getContext('2d');
  let partyWidth=0,partyHeight=0,partyFrame=0,partyLast=0,partyInView=true;
  let partyConfetti=[];
  const partyMotes=Array.from({length:innerWidth<600?68:125},(_,i)=>({x:Math.random(),y:Math.random(),size:.9+Math.random()*2.4,speed:.000017+Math.random()*.000028,phase:i*1.67,kind:i%5}));
  function resizePartyScene() {
    if (chapters.hidden || !partyContext) return;
    const rect=night.getBoundingClientRect();
    if (rect.width<1 || rect.height<1) return;
    partyWidth=rect.width;partyHeight=rect.height;
    const orb=$('disco-orb').getBoundingClientRect();
    night.style.setProperty('--light-x',`${orb.left-rect.left+orb.width*.5}px`);
    night.style.setProperty('--light-y',`${orb.top-rect.top+orb.height*.54}px`);
    const dpr=Math.min(devicePixelRatio || 1,1.5);
    partyCanvas.width=Math.round(partyWidth*dpr);partyCanvas.height=Math.round(partyHeight*dpr);
    partyContext.setTransform(dpr,0,0,dpr,0,0);
  }
  function seedPartyConfetti() {
    if (reducedMotion || !partyWidth) {partyConfetti=[];return;}
    partyConfetti=Array.from({length:innerWidth<600?70:140},(_,i)=>{
      const side=i%2 ? 1 : -1;
      return {x:partyWidth*(side===1?.12:.88),y:partyHeight*.9,
        vx:side*(1+Math.random()*7),vy:-6-Math.random()*9,size:2+Math.random()*3,
        angle:Math.random()*Math.PI,spin:(Math.random()-.5)*.12,age:0,life:160+Math.random()*75,
        colour:['#efd297','#d6a1e2','#b9d9e5','#f5e6c6'][i%4]};
    });
  }
  function reconcilePartyAnimation() {
    if (!partyContext) return;
    if (!lightsOn || reducedMotion || !partyInView || document.hidden) {
      if (partyFrame) cancelAnimationFrame(partyFrame);
      partyFrame=0;partyContext.clearRect(0,0,partyWidth,partyHeight);
      if (!lightsOn || reducedMotion) partyConfetti=[];
      return;
    }
    if (!partyFrame) {partyLast=performance.now();partyFrame=requestAnimationFrame(drawParty);}
  }
  function drawParty(time) {
    partyFrame=0;
    if (!lightsOn || reducedMotion || !partyInView || document.hidden) {reconcilePartyAnimation();return;}
    const elapsed=time-partyLast;
    if (elapsed<32) {partyFrame=requestAnimationFrame(drawParty);return;}
    const delta=Math.min(elapsed/16.67,3);partyLast=time;
    partyContext.clearRect(0,0,partyWidth,partyHeight);
    for (const mote of partyMotes) {
      mote.y-=mote.speed*delta*16.67;if(mote.y<-.03)mote.y=1.03;
      const twinkle=(Math.sin(time*.0014+mote.phase)+1)/2;
      const x=mote.x*partyWidth+Math.sin(time*.0004+mote.phase)*18,y=mote.y*partyHeight;
      partyContext.globalAlpha=.13+twinkle*.65;
      partyContext.fillStyle=mote.kind%2?'#ead4a2':'#cebbec';
      if(mote.kind===0)drawGlint(partyContext,x,y,mote.size*2.4);
      else {partyContext.beginPath();partyContext.arc(x,y,mote.size,0,Math.PI*2);partyContext.fill();}
    }
    for (const bit of partyConfetti) {
      bit.age+=delta;bit.x+=bit.vx*delta;bit.y+=bit.vy*delta;bit.vy+=.095*delta;bit.angle+=bit.spin*delta;
      partyContext.globalAlpha=Math.max(0,1-bit.age/bit.life)*.85;
      partyContext.fillStyle=bit.colour;partyContext.save();partyContext.translate(bit.x,bit.y);partyContext.rotate(bit.angle);
      partyContext.fillRect(-bit.size*.4,-bit.size,bit.size*.8,bit.size*2.7);partyContext.restore();
    }
    partyConfetti=partyConfetti.filter(bit=>bit.age<bit.life && bit.y<partyHeight+30);
    partyContext.globalAlpha=1;partyFrame=requestAnimationFrame(drawParty);
  }
  if ('IntersectionObserver' in window) {
    const partyObserver=new IntersectionObserver(entries=>{
      partyInView=entries[0].isIntersecting;reconcilePartyAnimation();
      night.classList.toggle('effects-suspended',!partyInView);
    },{threshold:.01});
    partyObserver.observe(night);
  }
  if ('ResizeObserver' in window) {const sceneObserver=new ResizeObserver(resizePartyScene);sceneObserver.observe(night);}
  effectsReady=true;

  // Lightweight ambient particles and the champagne fizz transition.
  const atmosphere = $('atmosphere');
  const atmosphereContext = atmosphere.getContext('2d');
  const fizzCanvas = $('fizz-canvas');
  const fizzContext = fizzCanvas.getContext('2d');
  let viewportWidth = innerWidth, viewportHeight = innerHeight, renderDpr = 1;
  const motes = Array.from({length:50},(_,i) => ({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.4,speed:.000025+Math.random()*.000065,phase:i*.9}));
  function resizeCanvases() {
    viewportWidth = innerWidth; viewportHeight = innerHeight; renderDpr = Math.min(devicePixelRatio || 1,2);
    [atmosphere,fizzCanvas].forEach(canvas => {
      canvas.width = Math.round(viewportWidth*renderDpr);
      canvas.height = Math.round(viewportHeight*renderDpr);
      const context = canvas.getContext('2d');
      if (context) context.setTransform(renderDpr,0,0,renderDpr,0,0);
    });
  }
  resizeCanvases();
  let lastAmbient = 0;
  function drawAtmosphere(time) {
    requestAnimationFrame(drawAtmosphere);
    if (!atmosphereContext || time-lastAmbient<33) return;
    const delta = Math.min(time-lastAmbient,60); lastAmbient = time;
    atmosphereContext.clearRect(0,0,viewportWidth,viewportHeight);
    if (reducedMotion || document.hidden || !opened) return;
    for (const mote of motes) {
      mote.y -= mote.speed*delta;
      if (mote.y < -.01) { mote.y=1.01; mote.x=Math.random(); }
      atmosphereContext.globalAlpha = .15+.4*(Math.sin(time*.0008+mote.phase)+1)/2;
      atmosphereContext.fillStyle = '#f2d499';
      atmosphereContext.beginPath();
      atmosphereContext.arc(mote.x*viewportWidth+Math.sin(time*.0003+mote.phase)*8,mote.y*viewportHeight,mote.r,0,Math.PI*2);
      atmosphereContext.fill();
    }
    atmosphereContext.globalAlpha = 1;
  }
  requestAnimationFrame(drawAtmosphere);

  function startFizz() {
    if (!fizzContext || reducedMotion) return;
    fizzCanvas.style.display = 'block';
    const rect = $('open-bottle').getBoundingClientRect();
    const originX = rect.left+rect.width/2, originY = rect.top+16;
    const bubbles = Array.from({length:175},(_,i) => {
      const cloud = i>90;
      return {x:cloud?Math.random()*viewportWidth:originX,y:cloud?Math.random()*viewportHeight:originY,vx:(Math.random()-.5)*(cloud?1:15),vy:cloud?-1-Math.random()*3:-5-Math.random()*15,r:cloud?4+Math.random()*24:1+Math.random()*7,delay:cloud?450+Math.random()*300:Math.random()*270,cloud,life:1};
    });
    const start = performance.now();
    let previous = start;
    function frame(now) {
      const elapsed = now-start;
      const delta = Math.min((now-previous)/16.67,2); previous=now;
      fizzContext.clearRect(0,0,viewportWidth,viewportHeight);
      for (const bubble of bubbles) {
        if (elapsed < bubble.delay) continue;
        bubble.x += bubble.vx*delta; bubble.y += bubble.vy*delta;
        if (!bubble.cloud) bubble.vy += .19*delta;
        const alpha = Math.max(0,1-(elapsed-bubble.delay)/1750);
        fizzContext.globalAlpha = alpha*.8;
        fizzContext.strokeStyle = '#fff3c8';
        fizzContext.fillStyle = bubble.cloud?'#fff1ba66':'#f9df9faa';
        fizzContext.lineWidth = 1;
        fizzContext.beginPath(); fizzContext.arc(bubble.x,bubble.y,bubble.r,0,Math.PI*2); fizzContext.fill(); fizzContext.stroke();
      }
      fizzContext.globalAlpha=1;
      if (elapsed<2350) requestAnimationFrame(frame);
      else { fizzContext.clearRect(0,0,viewportWidth,viewportHeight); fizzCanvas.style.display='none'; }
    }
    requestAnimationFrame(frame);
  }
  let resizeTimeout;
  window.addEventListener('resize',() => {
    clearTimeout(resizeTimeout);
    resizeTimeout=setTimeout(() => {resizeCanvases();paintScratch(true);resizePartyScene();},120);
  },{passive:true});
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) { resumeMusic = !music.paused; if (resumeMusic) music.pause(); }
    else { if (revealed) updateCountdown(); if (resumeMusic) { resumeMusic=false; playMusic(); } }
    reconcilePartyAnimation();
  });
  window.addEventListener('pagehide',() => { music.pause(); });
})();
