import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, Crosshair, Gamepad2, Heart, LogOut, Map, Menu, Shield, Users, X, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from './context/authcontext.jsx';
import { apiRequest } from "./context/services/api.js";

const weapons = [
  { id: 'awm', name: 'AWM', kind: 'Long-range sniper', damage: 'High damage', icon: '⌖' },
  { id: 'ump', name: 'UMP', kind: 'Close-range SMG', damage: 'Fast fire rate', icon: '↯' },
  { id: 'shotgun', name: 'Shotgun', kind: 'Close quarters', damage: 'Wide spread', icon: '▤' },
  { id: 'desert', name: 'Desert Eagle', kind: 'Heavy pistol', damage: 'Precision shots', icon: '◈' },
  { id: 'machine', name: 'Machine gun', kind: 'Sustained fire', damage: 'Large magazine', icon: '≋' }
];

function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <Link className="brand" to="/"><span className="brand-mark">D</span><span>DOOMSDAY<small>Squad survival project</small></span></Link>
    <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
    <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
      <NavLink to="/" onClick={() => setMenuOpen(false)}>Overview</NavLink>
      <NavLink to="/arena" onClick={() => setMenuOpen(false)}>Arena</NavLink>
      <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
      {user ? <><span className="nav-player"><span className="online-dot" />{user.username}</span><button className="nav-logout" onClick={logout}><LogOut size={15} /> Sign out</button></> : <Link className="nav-cta" to="/account">Player account <ArrowRight size={15} /></Link>}
    </nav>
  </header>;
}

function Home() {
  return <>
    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="online-dot pulse" /> MULTIPLAYER ARENA · PROJECT BUILD</div>
        <h1>Drop in.<br /><span>Stay alive.</span></h1>
        <p className="hero-lede">A squad-survival arena prototype with weapon loadouts, moving safe zones, vehicles, and an online multiplayer foundation.</p>
        <div className="hero-actions"><Link to="/arena" className="button button-primary"><Gamepad2 size={18} /> Enter the arena</Link><a href="#features" className="button button-quiet">Explore features <ArrowDown size={16} /></a></div>
        <div className="hero-proof"><span><Shield size={15} /> Local practice mode</span><span><Users size={15} /> Online room foundation</span></div>
      </div>
      <div className="hero-art" aria-label="Tactical map illustration">
        <div className="map-card"><div className="map-top"><span><Map size={15} /> TRAINING ISLAND</span><span className="map-live"><i /> SAFE ZONE</span></div><div className="map-scene"><div className="map-zone zone-outer" /><div className="map-zone zone-inner" /><span className="map-road road-one" /><span className="map-road road-two" /><span className="map-building building-one" /><span className="map-building building-two" /><span className="map-building building-three" /><span className="map-player player-one">▲</span><span className="map-player player-two">▲</span><span className="map-car">▰</span><span className="map-label label-a">NORTH RIDGE</span><span className="map-label label-b">OLD TOWN</span></div><div className="map-bottom"><span><b>04:32</b><small>ZONE CLOSES IN</small></span><span><b>04 / 08</b><small>PLAYERS IN ROOM</small></span><span><b>1.2 KM</b><small>SAFE AREA</small></span></div></div>
        <div className="floating-tag tag-weapon"><span className="tag-icon">⌖</span><span><b>AWM loadout</b><small>Precision ready</small></span></div><div className="floating-tag tag-squad"><span className="squad-avatars"><i>R</i><i>K</i><i>+</i></span><span><b>Squad status</b><small>Fireteam assembled</small></span></div>
      </div>
    </section>
    <section className="ticker"><div><span>DROP</span><b>✳</b><span>LOOT</span><b>✳</b><span>MOVE WITH THE ZONE</span><b>✳</b><span>DON’T FIGHT ALONE</span><b>✳</b><span>DROP</span></div></section>
    <section className="section wrap" id="features"><div className="section-heading"><div><div className="eyebrow">BUILT FOR THE LAST SQUAD STANDING</div><h2>Every run tells<br />a different story.</h2></div><p>Designed as an extensible college project: start with a playable practice arena, then add real server-hosted matches.</p></div>
      <div className="feature-grid"><article className="feature-card feature-wide"><div className="feature-icon orange"><Crosshair /></div><span className="feature-index">01 / COMBAT</span><h3>Choose your fight.</h3><p>Five distinct weapon classes, headshot multipliers, health feedback, and a live elimination counter make every encounter count.</p><div className="weapon-strip">{weapons.map((weapon) => <span key={weapon.id}>{weapon.icon}</span>)}</div></article><article className="feature-card"><div className="feature-icon green"><Activity /></div><span className="feature-index">02 / THE ZONE</span><h3>Keep moving.</h3><p>The safe zone contracts as the match clock runs down. Stay outside too long and your health drains.</p><div className="mini-zone"><i /><i /><i /></div></article><article className="feature-card"><div className="feature-icon blue"><Zap /></div><span className="feature-index">03 / MOBILITY</span><h3>Take the wheel.</h3><p>Find the marked vehicle, get in, and drive across the arena at higher speed.</p><div className="mini-car">▰ <span>VEHICLE READY</span></div></article></div>
    </section>
    <section className="cta-band"><div className="wrap cta-inner"><div><div className="eyebrow">YOUR DROP IS WAITING</div><h2>Ready to deploy?</h2><p>Jump into solo practice or create an account to try the multiplayer queue.</p></div><Link to="/arena" className="button button-primary">Launch game <ArrowRight size={18} /></Link></div></section>
    <Footer />
  </>;
}

function Footer() {
  return <footer className="footer wrap"><Link className="brand" to="/"><span className="brand-mark">D</span><span>DOOMSDAY<small>Squad survival project</small></span></Link><p>College project prototype · Online play requires the game server.</p><span>© 2025 DOOMSDAY</span></footer>;
}

function Account() {
  const { user, authenticate } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(mode, form);
      navigate('/arena');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  if (user) return <main className="account-page"><div className="account-card"><div className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="eyebrow">PLAYER PROFILE</div><h1>Welcome back, {user.username}.</h1><p>Your player account is ready. Join matchmaking or continue practicing locally.</p><Link to="/arena" className="button button-primary">Go to arena <ArrowRight size={17} /></Link></div></main>;
  return <main className="account-page"><form className="account-card" onSubmit={submit}><div className="eyebrow">PLAYER ACCESS</div><h1>{mode === 'login' ? 'Return to the fight.' : 'Create your callsign.'}</h1><p>{mode === 'login' ? 'Sign in to request an online match.' : 'Create a project account to enter the multiplayer queue.'}</p>
    {mode === 'register' && <label>Callsign<input required minLength="2" maxLength="18" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="e.g. NightRaven" /></label>}
    <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="player@example.com" /></label>
    <label>Password<input required minLength="10" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 10 characters" /></label>
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button button-primary button-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button>
    <p className="form-switch">{mode === 'login' ? 'New player?' : 'Already registered?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
    <p className="form-note">Accounts are stored by the configured Node/MongoDB backend. This is a project prototype—not a production identity provider.</p>
  </form></main>;
}

function GameArena({ mode, socket, room, onStatus }) {
  const canvasRef = useRef(null);
  const [weapon, setWeapon] = useState('awm');
  const [stats, setStats] = useState({ health: 100, score: 0, elapsed: 0, vehicle: false });
  const [notice, setNotice] = useState('WASD / arrows to move · Mouse or Space to fire');
  const [isDead, setIsDead] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const roomRef = useRef(room);
  const deathTimerRef = useRef(null);
  useEffect(() => { roomRef.current = room; }, [room]);
  const vehicleRef = useRef(false);
  const weaponRef = useRef(weapon);
  const restartRun = () => {
    if (deathTimerRef.current) {
      clearTimeout(deathTimerRef.current);
      deathTimerRef.current = null;
    }
    setIsDead(false);
    setNotice('WASD / arrows to move · Mouse or Space to fire');
    setStats({ health: 100, score: 0, elapsed: 0, vehicle: false });
    setRunKey((current) => current + 1);
    vehicleRef.current = false;
  };
  useEffect(() => { weaponRef.current = weapon; if (socket) socket.emit('player:weapon', weapon); }, [weapon, socket]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const input = new Set();
    const player = { x: 0, y: 0, hp: 100, angle: 0, shot: 0 };
    let enemies = [];
    let bullets = [];
    let timer = 0;
    let elapsed = 0;
    let score = 0;
    let lastHudUpdate = 0;
    let frameId;
    let last = performance.now();
    let mouse = { x: 0, y: 0, down: false };
    const scale = () => { const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); if (!player.x) { player.x = rect.width / 2; player.y = rect.height / 2; } };
    const keyDown = (event) => { const key = event.key.toLowerCase(); if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) event.preventDefault(); input.add(key); };
    const keyUp = (event) => input.delete(event.key.toLowerCase());
    const pointerMove = (event) => { const rect = canvas.getBoundingClientRect(); mouse.x = event.clientX - rect.left; mouse.y = event.clientY - rect.top; };
    const pointerDown = (event) => { pointerMove(event); mouse.down = true; canvas.setPointerCapture?.(event.pointerId); };
    const pointerUp = () => { mouse.down = false; };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('resize', scale);
    canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerdown', pointerDown); window.addEventListener('pointerup', pointerUp);
    scale();
    const drawUnit = (x, y, color, angle, radius = 10) => { ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 3, radius * .8, radius, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(4, -radius * .6, radius * .4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = color; ctx.fillRect(3, -2, radius + 11, 4); ctx.restore(); };
    function animate(now) {
      const dt = Math.min((now - last) / 1000, .04); last = now;
      const width = canvas.clientWidth; const height = canvas.clientHeight;
      if (mode === 'practice') {
        elapsed += dt; timer += dt;
        let dx = Number(input.has('d') || input.has('arrowright')) - Number(input.has('a') || input.has('arrowleft'));
        let dy = Number(input.has('s') || input.has('arrowdown')) - Number(input.has('w') || input.has('arrowup'));
        const length = Math.hypot(dx, dy) || 1;
        const driving = vehicleRef.current;
        const speed = driving ? 300 : 180;
        player.x = Math.max(12, Math.min(width - 12, player.x + dx / length * speed * dt)); player.y = Math.max(12, Math.min(height - 12, player.y + dy / length * speed * dt));
        const target = enemies.reduce((best, enemy) => !best || Math.hypot(enemy.x-player.x,enemy.y-player.y) < best.distance ? { enemy, distance: Math.hypot(enemy.x-player.x,enemy.y-player.y) } : best, null);
        if (mouse.down) player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x); else if (target) player.angle = Math.atan2(target.enemy.y-player.y,target.enemy.x-player.x);
        player.shot -= dt;
        if ((mouse.down || input.has(' ')) && target && player.shot <= 0) {
          const info = weaponRef.current; const damage = info === 'awm' ? 68 : info === 'shotgun' ? 22 : info === 'desert' ? 40 : info === 'machine' ? 14 : 19;
          bullets.push({ x: player.x, y: player.y, target: target.enemy, damage, life: .38, headshot: info === 'awm' });
          player.shot = info === 'machine' ? .11 : info === 'ump' ? .17 : info === 'shotgun' ? .62 : .48;
        }
        if (timer > 1.25 && enemies.length < 8) { const side = Math.floor(Math.random() * 4); enemies.push({ x: side === 1 ? width + 12 : side === 3 ? -12 : Math.random()*width, y: side === 0 ? -12 : side === 2 ? height + 12 : Math.random()*height, hp: 100, speed: 30 + Math.random()*22, angle: 0 }); timer = 0; }
        enemies.forEach((enemy) => { const ex = player.x-enemy.x; const ey = player.y-enemy.y; const distance = Math.hypot(ex,ey)||1; enemy.angle = Math.atan2(ey,ex); enemy.x += ex/distance*enemy.speed*dt; enemy.y += ey/distance*enemy.speed*dt; if (distance < 19) player.hp = Math.max(0, player.hp - 13*dt); });
        bullets.forEach((bullet) => { const enemy = bullet.target; if (!enemies.includes(enemy)) { bullet.life = 0; return; } const dx = enemy.x - bullet.x; const dy = enemy.y - bullet.y; const d = Math.hypot(dx,dy)||1; const step = 600*dt; bullet.x += dx/d*step; bullet.y += dy/d*step; bullet.life -= dt; if (d < step + 12) { const headshot = Math.random() > .55; enemy.hp -= bullet.damage * (headshot ? 1.6 : 1); bullet.life = 0; if (headshot) setNotice('HEADSHOT — target down!'); if (enemy.hp <= 0) { enemies = enemies.filter((item) => item !== enemy); score += 1; } } });
        bullets = bullets.filter((bullet) => bullet.life > 0);
        const shrink = Math.min(1, elapsed / 160); const zone = Math.min(width,height) * (.43 - shrink*.28); const outside = Math.hypot(player.x-width/2,player.y-height/2) > zone; if (outside) player.hp = Math.max(0, player.hp - 6*dt);
        if (player.hp <= 0) {
          player.hp = 0;
          setIsDead(true);
          setNotice('YOU DIED — restarting the run...');
          setStats({ health: 0, score, elapsed: Math.floor(elapsed), vehicle: vehicleRef.current });
          if (deathTimerRef.current) clearTimeout(deathTimerRef.current);
          deathTimerRef.current = window.setTimeout(() => {
            restartRun();
          }, 1400);
          return;
        }
        if (Math.floor(elapsed) !== Math.floor(elapsed-dt)) setStats({ health: Math.ceil(player.hp), score, elapsed: Math.floor(elapsed), vehicle: vehicleRef.current });
        ctx.fillStyle = '#11191b'; ctx.fillRect(0,0,width,height); ctx.strokeStyle = 'rgba(225,238,226,.07)'; ctx.lineWidth = 1;
        for (let x=0;x<width;x+=38) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke(); } for (let y=0;y<height;y+=38) {ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
        ctx.fillStyle = '#25312d'; [[.12,.2,.14,.12],[.7,.16,.16,.12],[.18,.69,.16,.13],[.67,.68,.18,.14],[.42,.42,.12,.1]].forEach(([x,y,w,h])=>ctx.fillRect(x*width,y*height,w*width,h*height));
        ctx.strokeStyle = '#e6b953'; ctx.lineWidth=3; ctx.beginPath();ctx.arc(width/2,height/2,zone,0,Math.PI*2);ctx.stroke();
        enemies.forEach((enemy)=>drawUnit(enemy.x,enemy.y,'#ee6756',enemy.angle)); bullets.forEach((bullet)=>{ctx.fillStyle=bullet.headshot?'#f4c15c':'#f5f0da';ctx.beginPath();ctx.arc(bullet.x,bullet.y,3,0,Math.PI*2);ctx.fill();});
        if (vehicleRef.current) { ctx.save();ctx.translate(player.x+22,player.y+24);ctx.rotate(player.angle);ctx.fillStyle='#e8b94f';ctx.fillRect(-18,-9,36,18);ctx.fillStyle='#242b27';ctx.fillRect(-5,-7,12,14);ctx.restore(); }
        drawUnit(player.x,player.y,vehicleRef.current?'#e8b94f':'#ff684e',player.angle,12);
        if (outside) {ctx.fillStyle='rgba(213,66,60,.12)';ctx.fillRect(0,0,width,height);}
      } else if (roomRef.current) {
        const currentRoom = roomRef.current;
        ctx.fillStyle='#11191b'; ctx.fillRect(0,0,width,height); ctx.strokeStyle='rgba(225,238,226,.07)'; for(let x=0;x<width;x+=38){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();} for(let y=0;y<height;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
        const ratioX=width/1200, ratioY=height/760; const zone=currentRoom.zone; ctx.strokeStyle='#e6b953';ctx.lineWidth=3;ctx.beginPath();ctx.arc(zone.x*ratioX,zone.y*ratioY,zone.radius*ratioX,0,Math.PI*2);ctx.stroke();
        currentRoom.players?.forEach((remote)=>{ const color=remote.id === socket?.id ? '#ff684e' : '#65d6a1'; drawUnit(remote.x*ratioX,remote.y*ratioY,color,remote.angle,remote.id===socket?.id?12:10); });
        const own=currentRoom.players?.find((item)=>item.id===socket?.id); if (own && now - lastHudUpdate > 500) { lastHudUpdate = now; setStats({health:Math.ceil(own.health),score:own.eliminations,elapsed:Math.floor((Date.now()-Date.parse(currentRoom.startedAt))/1000),vehicle:false}); }
      }
      if (socket?.connected && mode === 'online') {
        const liveRoom = roomRef.current;
        const ownPlayer = liveRoom?.players?.find((item) => item.id === socket.id);
        if (ownPlayer && mouse.down) player.angle = Math.atan2(mouse.y - ownPlayer.y * (height / 760), mouse.x - ownPlayer.x * (width / 1200));
        socket.emit('player:input', { up:input.has('w')||input.has('arrowup'), down:input.has('s')||input.has('arrowdown'), left:input.has('a')||input.has('arrowleft'), right:input.has('d')||input.has('arrowright'), angle:player.angle });
      }
      if (socket?.connected && mode === 'online' && input.has(' ')) socket.emit('player:fire');
      frameId = requestAnimationFrame(animate);
    }
    frameId = requestAnimationFrame(animate);
    return () => {
      if (deathTimerRef.current) {
        clearTimeout(deathTimerRef.current);
        deathTimerRef.current = null;
      }
      cancelAnimationFrame(frameId); window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('resize',scale);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerdown',pointerDown);window.removeEventListener('pointerup',pointerUp);
    };
  }, [mode, socket, runKey]);
  return <div className="arena-shell"><div className="arena-canvas-wrap"><canvas ref={canvasRef} className="arena-canvas" aria-label="Playable tactical arena" /><div className="arena-notice">{notice}</div><div className="canvas-compass">N <span>·</span> TRAINING ISLAND</div></div>
    <aside className="game-hud"><div className="hud-top"><span className="eyebrow">{mode === 'online' ? 'LIVE MATCH' : 'SOLO PRACTICE'}</span><span className="live-pill"><i />{mode === 'online' ? 'CONNECTED' : 'LOCAL'}</span></div><div className="hud-stat"><span>HEALTH</span><b>{stats.health}%</b></div><div className="health-track"><i style={{ width: `${stats.health}%` }} /></div><div className="hud-grid">        <div><small>ELIMS</small><b>{stats.score}</b></div><div><small>ZONE CLOSES</small><b>{String(Math.floor(Math.max(0,160-stats.elapsed)/60)).padStart(2,'0')}:{String(Math.max(0,160-stats.elapsed)%60).padStart(2,'0')}</b></div></div><label className="field-label" htmlFor="weapon">WEAPON LOADOUT</label><select id="weapon" value={weapon} onChange={(event)=>setWeapon(event.target.value)}>{weapons.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.kind}</option>)}</select><div className="weapon-description">{weapons.find((item)=>item.id===weapon)?.damage} <span> · 1 of 5 loadouts</span></div><button className={stats.vehicle?'button button-primary button-full':'button button-outline button-full'} onClick={()=>{vehicleRef.current=!vehicleRef.current;setStats((prev)=>({...prev,vehicle:vehicleRef.current}));setNotice(vehicleRef.current?'Vehicle engaged — drive with WASD / arrow keys':'On foot — stay inside the safe zone');}}>{stats.vehicle?'Exit vehicle':'Enter vehicle'}</button>{isDead && <button className="button button-primary button-full" onClick={restartRun}>Restart run</button>}<div className="controls-note"><b>CONTROLS</b><span>W A S D <i>Move</i></span><span>Mouse <i>Aim & fire</i></span><span>Space <i>Auto-fire</i></span><span>Zone <i>Contracts over time</i></span></div>{mode==='online'&&<div className="room-info"><Users size={15}/>{room?.players?.length || 0} players in your room</div>}<p className="prototype-note">Prototype mode: gameplay is for demonstration. Online matches need the server connected and hosted.</p></aside></div>;
}

function Arena() {
  const { user } = useAuth();
  const [mode, setMode] = useState('practice');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => socket?.disconnect(), [socket]);
  async function joinOnline() {
    if (!user) { setError('Sign in or create a player account before joining online matchmaking.'); return; }
    setConnecting(true); setError(''); setStatus('Connecting to the game server…');
    try {
      await apiRequest('/api/v1/health');
      const connection = io('/', { auth: { token: localStorage.getItem('doomsday-token') }, transports: ['websocket','polling'] });
      connection.on('connect', () => { connection.emit('match:find'); setStatus('Searching for a match…'); });
      connection.on('match:joined', (payload) => { setRoom(payload.room); setMode('online'); setStatus('Match found · survive the zone'); setConnecting(false); });
      connection.on('match:state', (state) => setRoom(state));
      connection.on('match:error', (payload) => { setError(payload.message); setConnecting(false); });
      connection.on('connect_error', (reason) => { setError(reason.message || 'Could not connect to the game server.'); setConnecting(false); });
      setSocket(connection);
    } catch (requestError) { setError(`${requestError.message} Start the backend server and MongoDB, then try again.`); setConnecting(false); }
  }
  function leaveOnline() { socket?.emit('match:leave'); socket?.disconnect(); setSocket(null); setRoom(null); setMode('practice'); setStatus(''); }
  return <main className="game-page wrap"><div className="game-page-heading"><div><div className="eyebrow">DOOMSDAY · TRAINING ISLAND</div><h1>Battle arena</h1><p>Choose a mode and get ready to deploy. The practice arena works locally in your browser.</p></div><Link to="/" className="back-link">← Back to briefing</Link></div><div className="mode-row"><button className={mode==='practice'?'mode-button selected':'mode-button'} onClick={()=>{if(mode==='online')leaveOnline();else setMode('practice');}}><Gamepad2 size={17}/> Solo practice <span>Available now</span></button><button className={mode==='online'?'mode-button selected':'mode-button'} disabled={connecting||mode==='online'} onClick={joinOnline}><Users size={17}/> Online matchmaking <span>{connecting?'Connecting…':user?'Requires server':'Sign in required'}</span></button>{mode==='online'&&<button className="leave-match" onClick={leaveOnline}>Leave match</button>}</div>{(error||status)&&<div className={error?'notice notice-error':'notice'}>{error||status}{error&&<button onClick={()=>setError('')} aria-label="Dismiss"><X size={15}/></button>}</div>}<GameArena mode={mode} socket={socket} room={room} onStatus={setStatus}/><Footer /></main>;
}

function NotFound() { return <main className="account-page"><div className="account-card"><div className="eyebrow">404 · LOST IN THE ZONE</div><h1>Nothing here.</h1><p>This page fell outside the safe area.</p><Link className="button button-primary" to="/">Return to base</Link></div></main>; }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<Home />} /><Route path="/arena" element={<Arena />} /><Route path="/account" element={<Account />} /><Route path="*" element={<NotFound />} /></Routes></>;
}