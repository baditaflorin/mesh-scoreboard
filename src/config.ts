import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-scoreboard",
  description: "A small shared score board for browser-local games and challenges.",
  accentHex: "#d8692f",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
