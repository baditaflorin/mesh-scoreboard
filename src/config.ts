import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-scoreboard",
  displayName: "Scoreboard",
  visualProfile: "play",
  shellLayout: "inset",
  description: "A shared, peer-to-peer match board for keeping every point visible to the room.",
  accentHex: "#f5b942",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
