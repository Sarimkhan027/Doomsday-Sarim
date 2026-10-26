import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import User from "../models/user.js";

const MAX_PLAYERS = 8;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 760;
const PLAYER_SPEED = 220;
const TICK_RATE = 50;
const rooms = new Map();
const waitingRooms = new Set();

function publicPlayer(player) {
  return {
    id: player.id,
    username: player.username,
    x: player.x,
    y: player.y,
    angle: player.angle,
    health: player.health,
    eliminations: player.eliminations,
    weapon: player.weapon,
  };
}

function roomState(room) {
  return {
    roomId: room.id,
    map: room.map,
    startedAt: room.startedAt,
    zone: room.zone,
    players: [...room.players.values()].map(publicPlayer),
  };
}

function broadcastRoom(io, room) {
  io.to(room.id).emit("match:state", roomState(room));
}

function removePlayer(io, socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  socket.data.roomId = null;
  if (!room) return;

  room.players.delete(socket.id);
  socket.leave(roomId);

  if (room.players.size === 0) {
    rooms.delete(roomId);
    waitingRooms.delete(roomId);
    clearInterval(room.interval);
    return;
  }

  broadcastRoom(io, room);
}

async function joinQueue(io, socket) {
  removePlayer(io, socket);

  let room = [...waitingRooms]
    .map((id) => rooms.get(id))
    .find((candidate) => candidate && candidate.players.size < MAX_PLAYERS);

  if (!room) {
    room = {
      id: randomUUID(),
      map: "training-island",
      startedAt: new Date().toISOString(),
      players: new Map(),
      zone: {
        x: MAP_WIDTH / 2,
        y: MAP_HEIGHT / 2,
        radius: 340,
      },
      lastTick: Date.now(),
      interval: null,
    };
    rooms.set(room.id, room);
    waitingRooms.add(room.id);
    room.interval = setInterval(() => tickRoom(io, room), TICK_RATE);
  }

  const user = await User.findById(socket.user.sub).select("username");
  if (!user) {
    socket.emit("match:error", {
      message: "Player account not found. Sign in again.",
    });
    return;
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
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    lastShotAt: 0,
  };

  room.players.set(socket.id, player);
  socket.data.roomId = room.id;
  await socket.join(room.id);

  if (room.players.size >= MAX_PLAYERS) waitingRooms.delete(room.id);
  socket.emit("match:joined", {
    playerId: socket.id,
    room: roomState(room),
  });
  broadcastRoom(io, room);
}

function tickRoom(io, room) {
  const now = Date.now();
  const delta = Math.min((now - room.lastTick) / 1000, 0.1);
  room.lastTick = now;

  for (const player of room.players.values()) {
    let dx = Number(player.input.right) - Number(player.input.left);
    let dy = Number(player.input.down) - Number(player.input.up);
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
      player.health > 0 &&
      Math.hypot(player.x - room.zone.x, player.y - room.zone.y) >
        room.zone.radius
    ) {
      player.health = Math.max(0, player.health - 4 * delta);
    }
  }

  const elapsedSeconds = Math.floor((now - Date.parse(room.startedAt)) / 1000);
  room.zone.radius = Math.max(95, 340 - Math.max(0, elapsedSeconds - 20) * 2.6);
  broadcastRoom(io, room);
}

export function attachGameSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("match:find", () => {
      joinQueue(io, socket).catch(() => {
        socket.emit("match:error", {
          message: "Could not join a match. Please try again.",
        });
      });
    });

    socket.on("player:input", (input = {}) => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      if (!player || player.health <= 0) return;

      player.input = {
        up: input.up === true,
        down: input.down === true,
        left: input.left === true,
        right: input.right === true,
      };
      if (Number.isFinite(input.angle))
        player.angle = Math.max(-Math.PI, Math.min(Math.PI, input.angle));
    });

    socket.on("player:weapon", (weapon) => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      const available = new Set(["awm", "ump", "shotgun", "desert", "machine"]);
      if (player && available.has(weapon)) player.weapon = weapon;
    });

    socket.on("player:fire", () => {
      const room = rooms.get(socket.data.roomId);
      const player = room?.players.get(socket.id);
      if (!room || !player || player.health <= 0) return;

      const now = Date.now();
      if (now - player.lastShotAt < 180) return;
      player.lastShotAt = now;

      const target = [...room.players.values()]
        .filter(
          (candidate) => candidate.id !== player.id && candidate.health > 0,
        )
        .sort(
          (first, second) =>
            Math.hypot(first.x - player.x, first.y - player.y) -
            Math.hypot(second.x - player.x, second.y - player.y),
        )[0];

      if (!target) return;
      const distance = Math.hypot(target.x - player.x, target.y - player.y);
      if (distance > 420) return;

      const hitChance =
        player.weapon === "awm"
          ? 0.72
          : player.weapon === "shotgun"
            ? 0.58
            : 0.42;
      if (Math.random() < hitChance) {
        target.health = Math.max(
          0,
          target.health -
            (player.weapon === "awm"
              ? 75
              : player.weapon === "shotgun"
                ? 35
                : 24),
        );
        if (target.health === 0) player.eliminations += 1;
      }
    });

    socket.on("match:leave", () => removePlayer(io, socket));
    socket.on("disconnect", () => removePlayer(io, socket));
  });
}
