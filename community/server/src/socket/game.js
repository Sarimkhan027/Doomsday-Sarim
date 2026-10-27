import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import User from "../models/user.js";

const MAX_PLAYERS = 8;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 760;
const PLAYER_SPEED = 220;
const TICK_RATE = 50;
const WEAPONS = Object.freeze({
  awm: { damage: 75, cooldown: 850 },
  ump: { damage: 24, cooldown: 180 },
  shotgun: { damage: 35, cooldown: 650 },
  desert: { damage: 40, cooldown: 480 },
  machine: { damage: 14, cooldown: 110 },
});
const DEFAULT_MIN_PLAYERS = 2;

function configuredMinPlayers(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PLAYERS
    ? parsed
    : DEFAULT_MIN_PLAYERS;
}

function publicPlayer(player, room) {
  return {
    id: player.id,
    username: player.username,
    x: player.x,
    y: player.y,
    angle: player.angle,
    health: player.health,
    eliminations: player.eliminations,
    weapon: player.weapon,
    alive: player.health > 0,
    outsideZone:
      room.status === "playing" &&
      Math.hypot(player.x - room.zone.x, player.y - room.zone.y) >
        room.zone.radius,
  };
}

function roomState(room) {
  const players = [...room.players.values()].map((player) =>
    publicPlayer(player, room),
  );
  return {
    roomId: room.id,
    map: room.map,
    status: room.status,
    minimumPlayers: room.minimumPlayers,
    playerCount: players.length,
    aliveCount: players.filter((player) => player.alive).length,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    elapsedSeconds: room.startedAt
      ? Math.floor((Date.now() - Date.parse(room.startedAt)) / 1000)
      : 0,
    zone: room.zone,
    players,
    result: room.result,
  };
}

function broadcastRoom(io, room) {
  io.to(room.id).emit("match:state", roomState(room));
}

function stopRoom(room) {
  if (room.interval) {
    clearInterval(room.interval);
    room.interval = null;
  }
}

function finishMatch(io, room) {
  if (room.status !== "playing") return;
  const standings = [...room.players.values()].sort(
    (first, second) =>
      Number(second.health > 0) - Number(first.health > 0) ||
      second.eliminations - first.eliminations ||
      second.health - first.health,
  );
  const survivors = standings.filter((player) => player.health > 0);

  room.status = "finished";
  room.finishedAt = new Date().toISOString();
  room.result = {
    winner:
      survivors.length === 1
        ? { id: survivors[0].id, username: survivors[0].username }
        : null,
    standings: standings.map((player, index) => ({
      id: player.id,
      username: player.username,
      eliminations: player.eliminations,
      health: Math.ceil(player.health),
      place: index + 1,
    })),
  };
  stopRoom(room);
  broadcastRoom(io, room);
}

function finishIfOnePlayerRemains(io, room) {
  if (
    room.status === "playing" &&
    [...room.players.values()].filter((player) => player.health > 0).length <=
      1
  ) {
    finishMatch(io, room);
    return true;
  }
  return false;
}

function removePlayer(io, socket, rooms, waitingRooms) {
  const roomId = socket.data.roomId;
  socket.data.roomId = null;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room || !room.players.delete(socket.id)) return;
  socket.leave(roomId);

  if (room.players.size === 0) {
    stopRoom(room);
    rooms.delete(roomId);
    waitingRooms.delete(roomId);
    return;
  }

  if (!finishIfOnePlayerRemains(io, room)) broadcastRoom(io, room);
}

function createRoom(minimumPlayers) {
  const now = new Date();
  return {
    id: randomUUID(),
    map: "training-island",
    status: "waiting",
    minimumPlayers,
    createdAt: now.toISOString(),
    startedAt: null,
    finishedAt: null,
    players: new Map(),
    zone: {
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
      radius: 340,
    },
    lastTick: Date.now(),
    interval: null,
    result: null,
  };
}

function startMatch(io, room, waitingRooms) {
  if (room.status !== "waiting") return;
  room.status = "playing";
  room.startedAt = new Date().toISOString();
  room.lastTick = Date.now();
  waitingRooms.delete(room.id);
  room.interval = setInterval(() => tickRoom(io, room), TICK_RATE);
}

function tickRoom(io, room) {
  if (room.status !== "playing") return;

  const now = Date.now();
  const delta = Math.min((now - room.lastTick) / 1000, 0.1);
  room.lastTick = now;
  const elapsedSeconds = Math.floor((now - Date.parse(room.startedAt)) / 1000);
  room.zone.radius = Math.max(
    95,
    340 - Math.max(0, elapsedSeconds - 20) * 2.6,
  );

  for (const player of room.players.values()) {
    if (player.health <= 0) continue;

    const dx = Number(player.input.right) - Number(player.input.left);
    const dy = Number(player.input.down) - Number(player.input.up);
    const length = Math.hypot(dx, dy) || 1;
    player.x = Math.max(
      18,
      Math.min(MAP_WIDTH - 18, player.x + (dx / length) * PLAYER_SPEED * delta),
    );
    player.y = Math.max(
      18,
      Math.min(
        MAP_HEIGHT - 18,
        player.y + (dy / length) * PLAYER_SPEED * delta,
      ),
    );

    if (
      Math.hypot(player.x - room.zone.x, player.y - room.zone.y) >
      room.zone.radius
    ) {
      player.health = Math.max(0, player.health - 4 * delta);
    }
  }

  if (!finishIfOnePlayerRemains(io, room)) broadcastRoom(io, room);
}

async function lookupUser(userId) {
  return User.findById(userId).select("username");
}

export function attachGameSockets(
  io,
  {
    findUser = lookupUser,
    minPlayers = configuredMinPlayers(process.env.MATCH_MIN_PLAYERS),
  } = {},
) {
  const rooms = new Map();
  const waitingRooms = new Set();
  const activeSockets = new Map();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (!user || typeof user !== "object" || typeof user.sub !== "string") {
        return next(new Error("Invalid or expired session."));
      }
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.sub;
    const previousSocket = activeSockets.get(userId);
    if (previousSocket && previousSocket !== socket) {
      previousSocket.disconnect(true);
    }
    activeSockets.set(userId, socket);
    socket.data.roomId = null;
    socket.data.joiningMatch = false;

    socket.on("match:find", () => {
      if (socket.data.joiningMatch) return;
      if (socket.data.roomId) {
        const currentRoom = rooms.get(socket.data.roomId);
        if (currentRoom && currentRoom.status !== "finished") {
          socket.emit("match:joined", {
            playerId: socket.id,
            room: roomState(currentRoom),
          });
          return;
        }
        if (currentRoom?.status === "finished") {
          removePlayer(io, socket, rooms, waitingRooms);
        }
      }

      socket.data.joiningMatch = true;
      joinQueue(io, socket, { rooms, waitingRooms, findUser, minPlayers })
        .catch((error) => {
          console.error("Matchmaking failed:", error);
          socket.emit("match:error", {
            message: "Could not join a match. Please try again.",
          });
        })
        .finally(() => {
          socket.data.joiningMatch = false;
        });
    });

    socket.on("player:input", (input) => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      if (room?.status !== "playing" || !player || player.health <= 0) return;
      if (!input || typeof input !== "object" || Array.isArray(input)) return;

      player.input = {
        up: input.up === true,
        down: input.down === true,
        left: input.left === true,
        right: input.right === true,
      };
      if (Number.isFinite(input.angle)) {
        player.angle = Math.max(-Math.PI, Math.min(Math.PI, input.angle));
      }
    });

    socket.on("player:weapon", (weapon) => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      if (
        room?.status === "playing" &&
        player?.health > 0 &&
        typeof weapon === "string" &&
        Object.hasOwn(WEAPONS, weapon)
      ) {
        player.weapon = weapon;
      }
    });

    socket.on("player:fire", () => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      if (room?.status !== "playing" || !player || player.health <= 0) return;

      const weapon = WEAPONS[player.weapon];
      const now = Date.now();
      if (now - player.lastShotAt < weapon.cooldown) return;
      player.lastShotAt = now;

      let target = null;
      let targetDistance = Infinity;
      for (const candidate of room.players.values()) {
        if (candidate.id === player.id || candidate.health <= 0) continue;
        const dx = candidate.x - player.x;
        const dy = candidate.y - player.y;
        const distance = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        const angleDifference = Math.atan2(
          Math.sin(targetAngle - player.angle),
          Math.cos(targetAngle - player.angle),
        );
        if (
          distance <= 420 &&
          distance < targetDistance &&
          Math.abs(angleDifference) <= Math.PI / 3
        ) {
          target = candidate;
          targetDistance = distance;
        }
      }

      if (!target) return;
      target.health = Math.max(0, target.health - weapon.damage);
      if (target.health === 0) player.eliminations += 1;
      if (!finishIfOnePlayerRemains(io, room)) broadcastRoom(io, room);
    });

    socket.on("match:leave", () =>
      removePlayer(io, socket, rooms, waitingRooms),
    );
    socket.on("disconnect", () => {
      if (activeSockets.get(userId) === socket) activeSockets.delete(userId);
      removePlayer(io, socket, rooms, waitingRooms);
    });
  });
}

async function joinQueue(
  io,
  socket,
  { rooms, waitingRooms, findUser, minPlayers },
) {
  const user = await findUser(socket.user.sub);
  if (!user) {
    socket.emit("match:error", {
      message: "Player account not found. Sign in again.",
    });
    return;
  }

  let room = [...waitingRooms]
    .map((id) => rooms.get(id))
    .find((candidate) => candidate && candidate.players.size < MAX_PLAYERS);

  if (!room) {
    room = createRoom(minPlayers);
    rooms.set(room.id, room);
    waitingRooms.add(room.id);
  }

  const player = {
    id: socket.id,
    userId: user.id,
    username: user.username,
    x: 160 + Math.random() * (MAP_WIDTH - 320),
    y: 120 + Math.random() * (MAP_HEIGHT - 240),
    angle: 0,
    health: 100,
    eliminations: 0,
    weapon: "ump",
    input: { up: false, down: false, left: false, right: false },
    lastShotAt: 0,
  };

  room.players.set(socket.id, player);
  socket.data.roomId = room.id;
  try {
    await socket.join(room.id);
  } catch (error) {
    removePlayer(io, socket, rooms, waitingRooms);
    throw error;
  }

  if (!socket.connected) {
    removePlayer(io, socket, rooms, waitingRooms);
    return;
  }

  if (room.players.size >= MAX_PLAYERS) waitingRooms.delete(room.id);
  if (room.players.size >= room.minimumPlayers)
    startMatch(io, room, waitingRooms);

  socket.emit("match:joined", {
    playerId: socket.id,
    room: roomState(room),
  });
  broadcastRoom(io, room);
}
