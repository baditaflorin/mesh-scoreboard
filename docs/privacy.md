# Privacy — Scoreboard

## Threat model

This app is a peer-to-peer mesh. Any data that is shared via Yjs (the CRDT) or awareness is **visible to every other peer in the same room**. Treat the contents of a mesh room as semi-public among the people you share the room ID with.

### What other peers can see

- All Yjs CRDT state used by this app: player names and score totals for the room.
- Per-peer awareness state: ephemeral connection presence for the duration of the session.
- Your peer ID, a transient WebRTC client ID. Not tied to a user account.

### What the self-hosted infra can see

- The signaling server (`wss://turn.0docker.com/ws`) sees connection metadata: IP address, room ID hash, time of connection. It does **not** see message contents — all peer messages go directly over the WebRTC data channel.
- The TURN relay (`turn:turn.0docker.com:3479`) is only used when direct peer connection fails (strict NATs). When relayed, traffic flows through the TURN box but remains end-to-end encrypted (DTLS-SRTP).

### What stays local

- Settings, player name, signaling/TURN overrides, and room ID — all in localStorage.
- Nothing is persisted server-side. When all peers leave the room, the CRDT state evaporates.

## Capabilities used by this app

<!-- mesh:capabilities-block:start -->

- 🪪 **Display name** — the name you type is published to the room.

<!-- mesh:capabilities-block:end -->

## No accounts, no analytics

No login. No tracking pixels. No third-party analytics. No service worker error beacons.

## If you want stronger anonymity

This app does not use Semaphore-style commit-reveal for anonymity within the mesh. If anonymity matters for your use case, see the `mesh-mafia` reference app for the commit-reveal pattern.
