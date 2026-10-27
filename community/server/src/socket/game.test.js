import assert from "node:assert/strict";
import { after, test } from "node:test";
import jwt from "jsonwebtoken";
import { attachGameSockets } from "./game.js";

const secret = process.env.JWT_SECRET;
const activeGames = [];
process.env.JWT_SECRET = "local-multiplayer-test-secret";
after(() => {
  for (const game of activeGames) {
    for (const sockets of game.io.rooms.values()) {
      for (const socket of sockets) socket.disconnect();
    }
  }
  if (secret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = secret;
});

class FakeSocket {
  constructor(io, id, token) {
    this.io = io;
    this.id = id;
    this.handshake = { auth: token ? { token } : {} };
    this.data = {};
    this.connected = true;
    this.handlers = new Map();
    this.received = [];
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  emit(event, payload) {
    this.received.push({ event, payload });
  }

  clientEmit(event, payload) {
    return this.handlers.get(event)?.(payload);
  }

  async join(roomId) {
    this.io.join(roomId, this);
  }

  leave(roomId) {
    this.io.leave(roomId, this);
  }

  disconnect() {
    if (!this.connected) return;
    this.connected = false;
    this.handlers.get("disconnect")?.("io server disconnect");
  }

  latest(event) {
    return this.received.filter((item) => item.event === event).at(-1)?.payload;
  }
}

class FakeIO {
  constructor() {
    this.middleware = [];
    this.handlers = new Map();
    this.rooms = new Map();
  }

  use(handler) {
    this.middleware.push(handler);
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  to(roomId) {
    return {
      emit: (event, payload) => {
        for (const socket of this.rooms.get(roomId) || []) {
          socket.emit(event, payload);
        }
      },
    };
  }

  join(roomId, socket) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId).add(socket);
  }

  leave(roomId, socket) {
    const members = this.rooms.get(roomId);
    members?.delete(socket);
    if (members?.size === 0) this.rooms.delete(roomId);
  }

  async connect(socket) {
    for (const middleware of this.middleware) {
      const error = await new Promise((resolve) => {
        middleware(socket, resolve);
      });
      if (error) return error;
    }
    this.handlers.get("connection")(socket);
    return null;
  }
}

function createGame({ minPlayers = 2 } = {}) {
  const io = new FakeIO();
  attachGameSockets(io, {
    minPlayers,
    findUser: async (id) => ({ id, username: id }),
  });
  const game = { io };
  activeGames.push(game);
  let nextSocketId = 0;
  game.connect = async (
    userId,
    token = jwt.sign({ sub: userId }, process.env.JWT_SECRET),
  ) => {
    const socket = new FakeSocket(io, `socket-${++nextSocketId}`, token);
    const error = await io.connect(socket);
    return { socket, error };
  };
  return game;
}

async function waitFor(predicate, message) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(message);
}

test("rejects sockets without a valid signed-in player", async () => {
  const { io } = createGame();
  const missing = await io.connect(new FakeSocket(io, "missing-token"));
  assert.match(missing.message, /Authentication required/);

  const invalid = await io.connect(
    new FakeSocket(io, "invalid-token", "not-a-jwt"),
  );
  assert.match(invalid.message, /Invalid or expired session/);
});

test("waits for two players, validates movement, awards a winner, and requeues", async () => {
  const game = createGame();
  const originalRandom = Math.random;
  const spawnValues = [
    (500 - 160) / 880,
    (380 - 120) / 520,
    (520 - 160) / 880,
    (380 - 120) / 520,
  ];
  let spawnIndex = 0;

  try {
    Math.random = () => spawnValues[spawnIndex++] ?? 0.5;
    const { socket: first } = await game.connect("alpha");
    first.clientEmit("match:find");
    await waitFor(() => first.latest("match:joined"), "first player never joined");
    assert.equal(first.latest("match:joined").room.status, "waiting");

    const { socket: second } = await game.connect("bravo");
    second.clientEmit("match:find");
    await waitFor(
      () => second.latest("match:joined") || second.latest("match:error"),
      "match did not start after reaching its minimum player count",
    );
    assert.equal(second.latest("match:error"), undefined);
    assert.equal(second.latest("match:joined").room.status, "playing");
    assert.equal(first.latest("match:state").status, "playing");

    const initialX = first.latest("match:state").players.find(
      (player) => player.id === first.id,
    ).x;
    first.clientEmit("player:input", { right: "true", angle: Infinity });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(
      first.latest("match:state").players.find((player) => player.id === first.id)
        .x,
      initialX,
      "non-boolean movement input must not move the player",
    );

    first.clientEmit("player:input", { right: true, angle: 0 });
    await waitFor(
      () =>
        first.latest("match:state").players.find(
          (player) => player.id === first.id,
        ).x > initialX,
      "validated movement input was not applied",
    );

    first.clientEmit("player:input", { angle: 0 });
    first.clientEmit("player:weapon", "__proto__");
    first.clientEmit("player:weapon", "awm");
    first.clientEmit("player:fire");
    await waitFor(
      () =>
        first.latest("match:state").players.find(
          (player) => player.id === second.id,
        ).health === 25,
      "server did not apply authoritative weapon damage",
    );
    await new Promise((resolve) => setTimeout(resolve, 860));
    first.clientEmit("player:fire");
    await waitFor(
      () => first.latest("match:state").status === "finished",
      "match did not finish when only one player remained",
    );

    const finishedRoom = first.latest("match:state");
    const result = finishedRoom.result;
    assert.equal(result.winner.username, "alpha");
    assert.equal(result.standings[0].eliminations, 1);
    assert.equal(result.standings[1].health, 0);

    first.clientEmit("match:find");
    await waitFor(
      () =>
        first.latest("match:joined")?.room.status === "waiting" &&
        first.latest("match:joined").room.roomId !== finishedRoom.roomId,
      "player could not queue for a new round",
    );
  } finally {
    Math.random = originalRandom;
    for (const sockets of game.io.rooms.values()) {
      for (const socket of sockets) socket.disconnect();
    }
  }
});

test("cleans empty rooms, finishes a round on disconnect, and replaces duplicate sessions", async () => {
  const game = createGame();
  const { socket: first } = await game.connect("same-player");
  first.clientEmit("match:find");
  await waitFor(() => first.latest("match:joined"), "first player never joined");
  const firstRoomId = first.latest("match:joined").room.roomId;

  const { socket: replacement } = await game.connect("same-player");
  assert.equal(first.connected, false);
  replacement.clientEmit("match:find");
  await waitFor(
    () => replacement.latest("match:joined"),
    "replacement connection did not join a room",
  );
  assert.notEqual(replacement.latest("match:joined").room.roomId, firstRoomId);

  const { socket: opponent } = await game.connect("opponent");
  opponent.clientEmit("match:find");
  await waitFor(
    () => opponent.latest("match:joined")?.room.status === "playing",
    "second player did not start the match",
  );
  const activeRoomId = opponent.latest("match:joined").room.roomId;
  opponent.disconnect();
  assert.equal(
    replacement.latest("match:state").result.winner.username,
    "same-player",
  );
  replacement.disconnect();
  assert.equal(game.io.rooms.has(activeRoomId), false);

  const { socket: nextPlayer } = await game.connect("next-player");
  nextPlayer.clientEmit("match:find");
  await waitFor(() => nextPlayer.latest("match:joined"), "new room was not created");
  assert.equal(nextPlayer.latest("match:joined").room.status, "waiting");
  nextPlayer.disconnect();
});

test("supports eight-player rooms and starts a separate room after capacity", async () => {
  const game = createGame({ minPlayers: 8 });
  const players = [];

  for (let index = 0; index < 8; index += 1) {
    const { socket } = await game.connect(`player-${index}`);
    players.push(socket);
    socket.clientEmit("match:find");
    await waitFor(
      () => socket.latest("match:joined"),
      `player ${index + 1} did not join the room`,
    );
  }

  await waitFor(
    () => players[0].latest("match:state")?.status === "playing",
    "eight-player room did not start",
  );
  const fullRoom = players[0].latest("match:state");
  assert.equal(fullRoom.status, "playing");
  assert.equal(fullRoom.playerCount, 8);
  assert.ok(
    players.every(
      (socket) => socket.latest("match:joined").room.roomId === fullRoom.roomId,
    ),
  );

  const { socket: ninth } = await game.connect("player-8");
  ninth.clientEmit("match:find");
  await waitFor(() => ninth.latest("match:joined"), "ninth player did not queue");
  assert.notEqual(ninth.latest("match:joined").room.roomId, fullRoom.roomId);
  assert.equal(ninth.latest("match:joined").room.status, "waiting");

  for (const socket of [...players, ninth]) socket.disconnect();
});

test("applies safe-zone damage on the server", async () => {
  const game = createGame();
  const originalRandom = Math.random;
  const spawnValues = [
    0,
    0,
    1,
    1,
  ];
  let spawnIndex = 0;

  try {
    Math.random = () => spawnValues[spawnIndex++] ?? 0.5;
    const { socket: first } = await game.connect("outside-alpha");
    first.clientEmit("match:find");
    await waitFor(() => first.latest("match:joined"), "first player never joined");
    const { socket: second } = await game.connect("outside-bravo");
    second.clientEmit("match:find");
    await waitFor(
      () => second.latest("match:joined")?.room.status === "playing",
      "safe-zone test match did not start",
    );

    await waitFor(
      () =>
        first.latest("match:state").players.some(
          (player) => player.id === first.id && player.health < 100,
        ),
      "player outside the safe zone did not take server-side damage",
    );
  } finally {
    Math.random = originalRandom;
    for (const sockets of game.io.rooms.values()) {
      for (const socket of sockets) socket.disconnect();
    }
  }
});
