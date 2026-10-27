import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, Crosshair, Gamepad2, LogOut, Map, Menu, Shield, Users, X, Zap } from 'lucide-react';
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
    <Link className="brand" to="/"><span className="brand-mark">D</span><span>DOOMSDAY<small>Survive the collapse</small></span></Link>
    <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="primary-navigation">{menuOpen ? <X /> : <Menu />}</button>
    <nav id="primary-navigation" aria-label="Primary navigation" className={menuOpen ? 'main-nav open' : 'main-nav'}>
      <NavLink to="/" onClick={() => setMenuOpen(false)}>Overview</NavLink>
      <NavLink to="/arena" onClick={() => setMenuOpen(false)}>Arena</NavLink>
      <Link to="/#features" onClick={() => setMenuOpen(false)}>Intel</Link>
      {user ? <><span className="nav-player"><span className="online-dot" />{user.username}</span><button className="nav-logout" onClick={() => { logout(); setMenuOpen(false); }}><LogOut size={15} /> Sign out</button></> : <Link className="nav-cta" to="/account" onClick={() => setMenuOpen(false)}>Player account <ArrowRight size={15} /></Link>}
    </nav>
  </header>;
}

function Home() {
  const { user } = useAuth();
  return <>
    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="online-dot pulse" /> TRAINING ISLAND · SURVIVAL PROTOCOL</div>
        <h1>Survive the<br /><span>collapse.</span></h1>
        <p className="hero-lede">The world went dark. Gear up, hold the zone, and outlast the threat in a tactical survival arena built for the last squad standing.</p>
        <div className="hero-actions"><Link to="/arena" className="button button-primary"><Gamepad2 size={18} /> Enter arena</Link><Link to="/account" className="button button-quiet"><Shield size={16} /> Player account</Link></div>
        <div className="hero-proof"><span><Shield size={15} /> Solo practice · no account needed</span><span><Users size={15} /> {user ? `Signed in · ${user.username}` : 'Online queue · sign-in required'}</span></div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="map-card"><div className="map-top"><span><Map size={15} /> TRAINING ISLAND</span><span className="map-live"><i /> FIELD MAP</span></div><div className="map-scene"><div className="map-zone zone-outer" /><div className="map-zone zone-inner" /><span className="map-road road-one" /><span className="map-road road-two" /><span className="map-building building-one" /><span className="map-building building-two" /><span className="map-building building-three" /><span className="map-player player-one">▲</span><span className="map-player player-two">▲</span><span className="map-car">▰</span><span className="map-label label-a">NORTH RIDGE</span><span className="map-label label-b">OLD TOWN</span></div><div className="map-bottom"><span><b>SOLO</b><small>PRACTICE MODE</small></span><span><b>MAX 8</b><small>ONLINE PLAYERS</small></span><span><b>SERVER</b><small>REQUIRED ONLINE</small></span></div></div>
        <div className="floating-tag tag-weapon"><span className="tag-icon"><Crosshair size={17} /></span><span><b>Loadout ready</b><small>Five weapon classes</small></span></div><div className="floating-tag tag-squad"><span className="squad-avatars"><i><Shield size={11} /></i></span><span><b>Choose deployment</b><small>Practice or online queue</small></span></div>
      </div>
    </section>
    <section className="ticker" aria-label="Mission briefing"><div><span>DEPLOY</span><b>✳</b><span>HOLD THE LINE</span><b>✳</b><span>WATCH THE ZONE</span><b>✳</b><span>EXTRACT OR FALL</span><b>✳</b><span>DEPLOY</span></div></section>
    <section className="section wrap" id="features"><div className="section-heading"><div><div className="eyebrow">BUILT FOR THE LAST SQUAD STANDING</div><h2>Every run tells<br />a different story.</h2></div><p>Drop into a solo practice run or connect to the game server for real-time multiplayer survival.</p></div>
      <div className="feature-grid"><article className="feature-card feature-wide"><div className="feature-icon orange"><Crosshair /></div><span className="feature-index">01 / COMBAT</span><h3>Choose your fight.</h3><p>Switch between five loadouts in practice or online matches. Aim, fire, and track eliminations in the live HUD.</p><div className="weapon-strip">{weapons.map((weapon) => <span key={weapon.id} title={weapon.name}>{weapon.icon}</span>)}</div></article><article className="feature-card"><div className="feature-icon green"><Activity /></div><span className="feature-index">02 / THE ZONE</span><h3>Stay in bounds.</h3><p>The server controls the shrinking safe zone in online matches. Step outside and your health drains.</p><div className="mini-zone"><i /><i /><i /></div></article><article className="feature-card"><div className="feature-icon blue"><Zap /></div><span className="feature-index">03 / MOBILITY</span><h3>Change your pace.</h3><p>Try the vehicle toggle in solo practice to move faster across the training arena.</p><div className="mini-car">▰ <span>SOLO PRACTICE</span></div></article></div>
    </section>
    <section className="cta-band"><div className="wrap cta-inner"><div><div className="eyebrow">YOUR DROP IS WAITING</div><h2>Ready to deploy?</h2><p>Enter solo practice now, or sign in to join the server-backed matchmaking queue.</p></div><Link to="/arena" className="button button-primary">Enter arena <ArrowRight size={18} /></Link></div></section>
    <Footer />
  </>;
}

function Footer() {
  return <footer className="footer wrap"><Link className="brand" to="/"><span className="brand-mark">D</span><span>DOOMSDAY<small>Survive the collapse</small></span></Link><p>Solo practice available · Online matches require the game server.</p><span>COMMUNITY BUILD</span></footer>;
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
  if (user) return <main className="account-page"><section className="account-card profile-card"><div className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="eyebrow">PLAYER PROFILE · VERIFIED SESSION</div><h1>Welcome back, {user.username}.</h1><p>Your account is ready. Join server-backed matchmaking or continue practicing locally without leaving the deployment zone.</p><Link to="/arena" className="button button-primary">Enter arena <ArrowRight size={17} /></Link></section></main>;
  return <main className="account-page"><div className="account-layout"><section className="account-briefing"><Link className="briefing-return" to="/"><ArrowRight size={15} /> Return to overview</Link><span className="briefing-mark">D</span><div className="eyebrow">DOOMSDAY · PLAYER ACCESS</div><h1>{mode === 'login' ? 'Back into the fight.' : 'Join the survivors.'}</h1><p>{mode === 'login' ? 'Sign in to connect your callsign and enter the online queue.' : 'Create a callsign to join server-hosted matches with your squad.'}</p><div className="briefing-status"><span className="online-dot" /> SOLO PRACTICE DOES NOT REQUIRE AN ACCOUNT</div></section><form className="account-card" onSubmit={submit}><div className="eyebrow">SECURE PLAYER ACCESS</div><h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2><p className="account-intro">{mode === 'login' ? 'Enter your account credentials to continue.' : 'Your callsign will be visible to other players.'}</p>
    {mode === 'register' && <label>Callsign<input required minLength="2" maxLength="18" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="e.g. NightRaven" /></label>}
    <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="player@example.com" /></label>
    <label>Password<input required minLength="10" maxLength="128" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 10 characters" /></label>
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button button-primary button-full" disabled={busy} aria-busy={busy}>{busy ? <><span className="loading-spinner" aria-hidden="true" /> Connecting securely…</> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></>}</button>
    <p className="form-switch">{mode === 'login' ? 'New to Doomsday?' : 'Already have a callsign?'} <button type="button" aria-pressed={mode === 'register'} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
    <p className="form-note">Accounts are managed by the configured Node/MongoDB backend. Authentication tokens remain in this browser session.</p>
  </form></div></main>;
}

function GameArena({ mode, socket, room, onFindMatch }) {
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
      if (socket?.connected && mode === 'online' && (input.has(' ') || mouse.down)) socket.emit('player:fire');
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
  const ownPlayer = room?.players?.find((player) => player.id === socket?.id);
  const zoneStatus = ownPlayer ? (ownPlayer.outsideZone ? 'Outside safe zone' : 'Inside safe zone') : 'Waiting for match';
  return <div className="arena-shell">
    <div className="arena-canvas-wrap">
      <canvas ref={canvasRef} className="arena-canvas" aria-label="Playable tactical arena" />
      <div className="arena-notice">{mode === 'online' ? `${room?.status === 'playing' ? 'LIVE MATCH' : room?.status === 'finished' ? 'MATCH FINISHED' : 'LOBBY'} · ${room?.aliveCount ?? 0} ALIVE` : notice}</div>
      <div className="canvas-compass">N <span>·</span> TRAINING ISLAND</div>
      {room?.status === 'finished' && <section className="match-result" role="status" aria-live="polite">
        <span className="eyebrow">DOOMSDAY · MATCH RESULTS</span>
        <h2>{room.result?.winner ? `${room.result.winner.username} wins` : 'No survivors'}</h2>
        <p>{room.result?.winner?.id === socket?.id ? 'You are the last survivor.' : room.result?.winner ? 'The last survivor takes the round.' : 'The round ended without a survivor.'}</p>
        <ol>{room.result?.standings?.map((player) => <li key={player.id}><span>#{player.place} · {player.username}</span><span>{player.eliminations} elims</span></li>)}</ol>
      </section>}
    </div>
    <aside className="game-hud">
      <div className="hud-top"><span className="eyebrow">{mode === 'online' ? room?.status === 'waiting' ? 'MATCH LOBBY' : room?.status === 'finished' ? 'RESULTS' : 'LIVE MATCH' : 'SOLO PRACTICE'}</span><span className={`live-pill ${mode === 'online' ? socket?.connected ? 'live-pill-connected' : 'live-pill-reconnecting' : 'live-pill-local'}`}><i />{mode === 'online' ? socket?.connected ? 'CONNECTED' : connecting ? 'CONNECTING' : 'RECONNECTING' : 'LOCAL'}</span></div>
      {mode === 'online' && <section className="online-lobby" aria-live="polite" aria-label="Live match lobby">
        <div className="lobby-status"><b>{room?.status === 'playing' ? 'Match in progress' : room?.status === 'finished' ? 'Round complete' : connecting ? 'Connecting to the arena…' : room ? 'Waiting for players' : 'Joining matchmaking…'}</b><span>{room ? `${room.playerCount}/${8} players · ${room.status === 'waiting' ? `${room.minimumPlayers} needed to start` : `${room.aliveCount} alive`}` : status}</span></div>
        {room && <ul className="lobby-roster">{room.players.map((player) => <li key={player.id}><span><i className={player.alive ? 'roster-dot' : 'roster-dot eliminated'} />{player.username}{player.id === socket?.id ? ' (you)' : ''}</span><b>{player.alive ? `${Math.ceil(player.health)} HP` : 'OUT'}</b></li>)}</ul>}
        {room?.status === 'finished' && <button className="button button-primary button-full" onClick={() => { if (socket) onFindMatch(socket); }}>Find another match</button>}
        {!room && socket?.connected && !connecting && <button className="button button-outline button-full" onClick={() => { setError(''); setConnecting(true); socket.emit('match:find'); }}>Try matchmaking again</button>}
      </section>}
      <div className="hud-stat"><span>HEALTH</span><b>{mode === 'online' ? ownPlayer ? `${Math.ceil(ownPlayer.health)}%` : '—' : `${stats.health}%`}</b></div>
      <div className="health-track"><i style={{ width: `${mode === 'online' ? ownPlayer?.health ?? 0 : stats.health}%` }} /></div>
      <div className="hud-grid"><div><small>{mode === 'online' ? 'ELIMINATIONS' : 'ELIMS'}</small><b>{mode === 'online' ? ownPlayer?.eliminations ?? 0 : stats.score}</b></div><div><small>{mode === 'online' ? 'PLAYERS ALIVE' : 'ZONE CLOSES'}</small><b>{mode === 'online' ? room?.aliveCount ?? 0 : `${String(Math.floor(Math.max(0,160-stats.elapsed)/60)).padStart(2,'0')}:${String(Math.max(0,160-stats.elapsed)%60).padStart(2,'0')}`}</b></div></div>
      {mode === 'online' && <div className={ownPlayer?.outsideZone ? 'room-info zone-warning' : 'room-info'}><Shield size={15}/>{zoneStatus}{room?.status === 'playing' && room.elapsedSeconds >= 20 ? ' · shrinking' : ''}</div>}
      <label className="field-label" htmlFor="weapon">WEAPON LOADOUT</label>
      <select id="weapon" value={weapon} onChange={(event)=>setWeapon(event.target.value)} disabled={mode === 'online' && room?.status !== 'playing'}>{weapons.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.kind}</option>)}</select>
      <div className="weapon-description">{weapons.find((item)=>item.id===weapon)?.damage} <span> · 1 of 5 loadouts</span></div>
      {mode === 'practice' && <button className={stats.vehicle?'button button-primary button-full':'button button-outline button-full'} onClick={()=>{vehicleRef.current=!vehicleRef.current;setStats((prev)=>({...prev,vehicle:vehicleRef.current}));setNotice(vehicleRef.current?'Vehicle engaged — drive with WASD / arrow keys':'On foot — stay inside the safe zone');}}>{stats.vehicle?'Exit vehicle':'Enter vehicle'}</button>}
      {isDead && <button className="button button-primary button-full" onClick={restartRun}>Restart run</button>}
      <div className="controls-note"><b>CONTROLS</b><span>W A S D <i>Move</i></span><span>Mouse <i>Aim & fire</i></span><span>Space <i>Auto-fire</i></span><span>Zone <i>Contracts over time</i></span></div>
      {mode==='online' && <div className="room-info"><Users size={15}/>{room?.playerCount ?? 0} players in your room</div>}
      <p className="prototype-note">Prototype mode: gameplay is for demonstration. Online matches need the server connected and hosted.</p>
    </aside>
  </div>;
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
  useEffect(() => {
    if (!user && socket) leaveOnline();
  }, [user, socket]);
  function requestMatch(connection) {
    setError('');
    setRoom(null);
    setMode('online');
    setConnecting(true);
    setStatus('Joining matchmaking…');
    connection.emit('match:find');
  }
  async function joinOnline() {
    if (!user) { setError('Sign in or create a player account before joining online matchmaking.'); return; }
    setConnecting(true); setError(''); setStatus('Connecting to the game server…');
    try {
      await apiRequest('/api/v1/health');
      const connection = io('/', { auth: { token: localStorage.getItem('doomsday-token') }, transports: ['websocket','polling'] });
      connection.on('connect', () => requestMatch(connection));
      connection.on('disconnect', (reason) => {
        if (reason === 'io client disconnect') return;
        setRoom(null);
        if (reason === 'io server disconnect') {
          setConnecting(false);
          setError('This player account was disconnected from the server. Return to solo and reconnect.');
          return;
        }
        setConnecting(true);
        setStatus('Connection lost · reconnecting to matchmaking…');
      });
      connection.io.on('reconnect_attempt', (attempt) => {
        setConnecting(true);
        setStatus(`Reconnecting to the arena · attempt ${attempt}…`);
      });
      connection.on('match:joined', (payload) => { setRoom(payload.room); setMode('online'); setStatus(payload.room.status === 'waiting' ? 'Waiting for more players…' : 'Match found · survive the zone'); setConnecting(false); });
      connection.on('match:state', (state) => setRoom(state));
      connection.on('match:error', (payload) => { setError(payload.message); setConnecting(false); });
      connection.on('connect_error', (reason) => {
        if (!connection.active) {
          setError(reason.message || 'Could not connect to the game server.');
          setConnecting(false);
          return;
        }
        setConnecting(true);
        setStatus('Could not connect · retrying the game server…');
      });
      setSocket(connection);
    } catch (requestError) { setError(`${requestError.message} Start the backend server and MongoDB, then try again.`); setConnecting(false); }
  }
  function leaveOnline() { socket?.emit('match:leave'); socket?.disconnect(); setSocket(null); setRoom(null); setMode('practice'); setConnecting(false); setStatus(''); }
  return <main className="game-page wrap"><div className="game-page-heading"><div><div className="eyebrow">DOOMSDAY · TRAINING ISLAND</div><h1>Battle arena</h1><p>Choose a mode and get ready to deploy. The practice arena works locally in your browser.</p></div><Link to="/" className="back-link">← Back to briefing</Link></div><div className="mode-row"><button className={mode==='practice'?'mode-button selected':'mode-button'} onClick={()=>{if(mode==='online')leaveOnline();else setMode('practice');}}><Gamepad2 size={17}/> Solo practice <span>Available now</span></button><button className={mode==='online'?'mode-button selected':'mode-button'} disabled={connecting||mode==='online'} onClick={joinOnline}><Users size={17}/> Online matchmaking <span>{connecting?'Connecting…':user?'Requires server':'Sign in required'}</span></button>{mode==='online'&&<button className="leave-match" onClick={leaveOnline}>Return to solo</button>}</div>{(error||status)&&<div className={error?'notice notice-error':'notice'} role={error?'alert':'status'}>{error||status}{error&&<button onClick={()=>setError('')} aria-label="Dismiss"><X size={15}/></button>}</div>}<GameArena mode={mode} socket={socket} room={room} onFindMatch={requestMatch}/><Footer /></main>;
}

function NotFound() { return <main className="account-page"><section className="account-card not-found-card"><span className="briefing-mark" aria-hidden="true">D</span><div className="eyebrow">404 · SIGNAL LOST</div><h1>Outside the zone.</h1><p>This route is not part of the current deployment. Return to the overview to regroup.</p><Link className="button button-primary" to="/">Return to overview <ArrowRight size={17} /></Link></section></main>; }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<Home />} /><Route path="/arena" element={<Arena />} /><Route path="/account" element={<Account />} /><Route path="*" element={<NotFound />} /></Routes></>;
}