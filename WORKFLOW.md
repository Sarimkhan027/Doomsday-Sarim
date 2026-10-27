# Doomsday project workflow

## Project kya hai?

Doomsday ek browser-based squad-survival arena project hai. Repository mein alag-alag surfaces hain:

1. **Root static demo** — `index.html`, `game.js` aur `theme.css` wala standalone solo browser game.
2. **Community app** — `community/client` ka React/Vite app. Ismein overview, account, solo arena aur server-backed online matchmaking UI hai.
3. **Community backend** — `community/server` ka Express, MongoDB aur Socket.IO server. Ye authentication aur online match state chalata hai.
4. **Community static pages** — `community/games` aur `community/index.html`; ye React app ke routes nahi hain.

Root static demo aur Community app alag frontends hain. Ek mein kiya gaya change doosre mein apne aap nahi aata.

## Player ka flow

### Overview aur deployment

1. Player Community app ka overview kholta hai. Yahan se **Enter arena** ya **Player account** par ja sakta hai.
2. Overview solo practice ko account ke bina available batata hai; online queue ke liye sign-in chahiye.
3. App ka visual system charcoal/gunmetal panels, restrained crimson accents, tactical HUD details, responsive layouts aur local battlefield artwork use karta hai.

### Solo practice

1. Player `/arena` par **Solo practice** chunta hai. Is mode ko login ya backend ki zaroorat nahi.
2. `W`, `A`, `S`, `D` ya arrow keys se move karta hai; mouse se aim/fire karta hai ya `Space` se auto-fire karta hai.
3. Weapon loadout chunta hai; practice mode mein vehicle toggle bhi available hai.
4. Health, eliminations, timer/zone aur weapon HUD mein dikhte hain. Practice gameplay browser mein local hota hai.
5. Health zero hone par practice run restart hota hai; player manually bhi restart kar sakta hai.

### Account aur online match

1. Player `/account` par register ya sign in karta hai. Registration mein callsign, email aur password maange jaate hain; login mein email aur password.
2. React client credentials ko `/api/v1/auth/register` ya `/api/v1/auth/login` par bhejta hai.
3. Express server password hash karke MongoDB mein account rakhta hai, aur successful registration/sign-in par JWT deta hai. Client user aur token browser `localStorage` mein rakhta hai.
4. Signed-in player Arena mein **Online matchmaking** chunta hai. Client `/api/v1/health` check karta hai, phir JWT ke saath Socket.IO connection banata hai.
5. Server player ko matchmaking queue mein daalta hai. `MATCH_MIN_PLAYERS` poore hone par room `playing` state mein jaata hai; har room mein zyada se zyada 8 players hote hain.
6. Server movement aur weapon inputs validate karke player position, health, damage, eliminations aur safe-zone damage manage karta hai. Client sirf server ke diye match state ko dikhata hai.
7. Jab ek eligible player bachta hai, server winner aur finished result tay karta hai aur room mein broadcast karta hai. Player queue mein dobara ja sakta hai ya solo practice par laut sakta hai.
8. Leave ya unexpected disconnect par server player ko room se remove karta hai. Zaroorat ke mutabiq match finish hota hai aur empty rooms clean up hote hain.

## Project ke important parts

| Path | Zimmedari |
| --- | --- |
| `index.html`, `game.js`, `theme.css` | Standalone root static demo; Community React app se alag. |
| `community/client/src/app.jsx` | React routes, account forms, solo arena, matchmaking aur match UI. |
| `community/client/src/context/authcontext.jsx` | Login/register session state aur sign-out. |
| `community/client/src/context/services/api.js` | Backend API calls aur saved bearer token. |
| `community/client/src/styles.css` | Community app ka design system, pages, HUD aur responsive/accessibility styles. |
| `community/client/public/images/battlefield.svg` | App overview/account visuals ke liye local battlefield artwork. |
| `community/client/index.html` | React app ka title aur page metadata. |
| `community/client/vite.config.js` | Vite dev server aur API/Socket.IO proxy configuration. |
| `community/server/src/app.js` | Express API, health endpoint, CORS aur Socket.IO server. |
| `community/server/src/routes/auth.js` | Register, login aur current-user endpoints. |
| `community/server/src/models/user.js` | MongoDB player account schema. |
| `community/server/src/socket/game.js` | Online rooms, lifecycle, player movement/combat, safe zone aur results. |
| `community/server/src/socket/game.test.js` | Server-side multiplayer behavior ke automated tests. |
| `community/server/.env.example` | Local server environment variables ka template; real `.env` secrets ismein na daalein. |
| `WORKFLOW.md` | Ye project architecture, player flow aur local setup guide. |

React app ke routes: `/` (overview), `/arena` (game) aur `/account` (account). Unknown React routes consistent 404 page dikhate hain.

## Local development

1. MongoDB local ya reachable instance chalao.
2. `community/server/.env.example` ko `community/server/.env` mein copy karo. `JWT_SECRET` ko lambi random secret value se replace karo. `.env` ko commit mat karo; JWT secret server-only hai.
3. **Terminal 1** mein server chalao:

   ```powershell
   cd community/server
   npm install
   npm run dev
   ```

4. **Terminal 2** mein client chalao:

   ```powershell
   cd community/client
   npm install
   npm run dev
   ```

5. Vite ka local URL kholo (default `http://localhost:3000`). Vite config `/api` aur `/socket.io` requests ko `http://localhost:4000` par proxy karta hai.
6. Solo practice ke liye Arena kholo. Online matchmaking ke liye backend/MongoDB chalao aur kam-se-kam `MATCH_MIN_PLAYERS` signed-in players se connect karo.

`community/client/.env` mein `VITE_API_BASE` sirf tab set karo jab API Vite proxy ki jagah kisi alag base URL par ho.

Server settings (`community/server/.env`):

| Variable | Default | Kaam |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/doomsday` | MongoDB connection string. |
| `JWT_SECRET` | Example file mein placeholder | Server-only signing secret; deploy se pehle zaroor replace karo. |
| `PORT` | `4000` | Express/Socket.IO server port. |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed frontend origin; multiple origins comma-separated ho sakte hain. |
| `MATCH_MIN_PLAYERS` | `2` | Match shuru karne ke liye minimum players; allowed range `1`–`8`. |

Development mein `MATCH_MIN_PLAYERS=1` se lifecycle ko ek player ke saath test kiya ja sakta hai. Do-player match check ke liye alag accounts aur browsers/sessions use karo.

## Checks chalana

```powershell
cd community/server
npm test
```

Server tests authentication ke bina socket rejection, queue/start, input validation, disconnect/winner handling, duplicate sessions, room capacity aur safe-zone damage cover karte hain.

```powershell
cd community/client
npm run build
```

Client package mein alag lint script abhi configured nahi hai. Browser checks mein routes, responsive overflow, login/register form rendering, mobile navigation aur solo arena canvas verify kiye gaye hain. Real credentials aur hosted production matchmaking ko apne configured backend ke saath alag se test karo.

## Prototype ki seemaayein

- Solo practice local browser simulation hai; uski position, health ya results server/MongoDB mein save nahi hote.
- Online rooms, movement/combat, health/damage, safe-zone effects aur winner selection server-authoritative hain. Room limit 8 hai; match minimum `MATCH_MIN_PLAYERS` se configure hota hai.
- Reconnect matchmaking dobara join karta hai, lekin disconnect ke baad purani match position preserve nahi hoti.
- Match results persistent nahi hain; leaderboard, production-grade identity/social sign-in aur long-lived reconnect recovery included nahi hain.
- Vehicle gameplay solo practice ka feature hai; online match mein vehicle logic nahi hai.
- Root static demo aur Community ke static HTML pages alag hain; unka UI/game change React app mein automatically reflect nahi hota.
