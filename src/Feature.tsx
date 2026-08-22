import { useSharedScoreboard } from "@baditaflorin/mesh-common";
import type { MeshConfig, YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };
export function Feature({ room, config }: Props) {
  const board = useSharedScoreboard(room, "game-score");
  return <main className="feature-placeholder"><h1>{config.appName}</h1><p>{config.description}</p><p className="feature-status">{room ? "Connected" : "Connecting…"}</p><button type="button" onClick={() => board.add(1)}>Add my point</button><button type="button" onClick={() => board.add(-1)}>Remove my point</button><button type="button" onClick={() => board.reset()}>Reset board</button><ol aria-label="Scores">{board.scores.map(({ peerId, score }) => <li key={peerId}>{peerId}: <strong>{score}</strong></li>)}</ol></main>;
}
