import { useEffect, useMemo, useState } from "react";
import {
  MeshButton,
  MeshNameInput,
  MeshPage,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useNamedPeer,
  useSharedScoreboard,
} from "@baditaflorin/mesh-common";
import type { MeshConfig, YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

type ScorePlayer = {
  peerId: string;
  name: string;
  score: number;
  isMe: boolean;
};

function pointCopy(score: number): string {
  return `${score} ${Math.abs(score) === 1 ? "point" : "points"}`;
}

function shortPeerId(peerId: string): string {
  return peerId.length > 7 ? `player-${peerId.slice(0, 6)}` : peerId;
}

/**
 * A small but complete, peer-attributed score surface. `useSharedScoreboard`
 * remains the source of truth: every visible total is derived from its Y.Map,
 * not a local animation state or a mocked presence count.
 */
export function Feature({ room, config }: Props) {
  const board = useSharedScoreboard(room, "game-score");
  const namedPeer = useNamedPeer(config, room);
  const [notice, setNotice] = useState("Set your name, then keep the match moving.");
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    setResetArmed(false);
    setNotice(
      room ? "This room is ready for its first point." : "Preparing your shared score room…",
    );
  }, [room?.roomId]);

  const players = useMemo<ScorePlayer[]>(() => {
    const scoresByPeer = new Map(board.scores.map((entry) => [entry.peerId, entry.score]));
    const peerIds = new Set([...scoresByPeer.keys(), ...Object.keys(namedPeer.names)]);
    if (room?.peerId) peerIds.add(room.peerId);

    return [...peerIds]
      .map((peerId) => {
        const isMe = peerId === room?.peerId;
        const registeredName = isMe ? namedPeer.name.trim() : namedPeer.nameOf(peerId);
        return {
          peerId,
          name: registeredName || (isMe ? "You" : shortPeerId(peerId)),
          score: scoresByPeer.get(peerId) ?? 0,
          isMe,
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [board.scores, namedPeer, room?.peerId]);

  const myScore = board.scores.find((entry) => entry.peerId === room?.peerId)?.score ?? 0;
  const totalDevices = room ? room.peerCount + 1 : 0;
  const peerLabel = room?.peerCount
    ? `${room.peerCount + 1} devices in room`
    : room
      ? "1 device in room"
      : "Joining room";

  function changeMyScore(delta: number) {
    const changed = board.add(delta);
    if (!changed) {
      setNotice("Still connecting to the room. Try again in a moment.");
      return;
    }
    setResetArmed(false);
    setNotice(
      delta > 0
        ? `Added ${pointCopy(delta)} to ${namedPeer.name.trim() || "your"} score.`
        : `Removed ${pointCopy(Math.abs(delta))} from ${namedPeer.name.trim() || "your"} score.`,
    );
  }

  function resetBoard() {
    if (!room) {
      setNotice("Still connecting to the room. No score has been changed.");
      return;
    }
    if (!resetArmed) {
      setResetArmed(true);
      setNotice("Click Reset board again to clear every player’s score in this room.");
      return;
    }
    board.reset();
    setResetArmed(false);
    setNotice("The shared board is clear. Start the next round when you are ready.");
  }

  return (
    <MeshPage as="main" maxWidth="74rem" className="scoreboard-page">
      <section className="scoreboard-intro" aria-labelledby="scoreboard-title">
        <div className="scoreboard-intro-copy">
          <p className="scoreboard-kicker">Live match control</p>
          <h1 id="scoreboard-title">Keep every point in view.</h1>
          <p className="scoreboard-promise">
            A clean shared ledger for the room—built for the moments when the game is moving too
            fast for a spreadsheet.
          </p>
        </div>
        <div className="scoreboard-session-meta" aria-label="Room status">
          <MeshStatusPill tone={room ? "live" : "warning"} dot announce="polite">
            {room ? "Room ready" : "Joining room"}
          </MeshStatusPill>
          <MeshPresence
            count={totalDevices}
            label={peerLabel}
            state={room ? (room.peerCount > 0 ? "connected" : "idle") : "connecting"}
          />
        </div>
      </section>

      <section className="scoreboard-workspace" aria-label="Scoreboard workspace">
        <MeshSurface
          as="section"
          tone="accent"
          padding="lg"
          className="scoreboard-command-surface"
          aria-labelledby="your-score-title"
        >
          <div className="scoreboard-command-topline">
            <div>
              <p className="scoreboard-panel-label">Your score</p>
              <h2 id="your-score-title">Make the next call.</h2>
            </div>
            <span className="scoreboard-room-copy">Peer-to-peer room</span>
          </div>

          <div className="scoreboard-score-readout" aria-live="polite" aria-atomic="true">
            <span className="scoreboard-score-number" data-testid="my-score">
              {myScore}
            </span>
            <span className="scoreboard-score-caption">{pointCopy(myScore)}</span>
          </div>

          <div className="scoreboard-actions" aria-label="Your score actions">
            <MeshButton
              size="lg"
              fullWidth
              disabled={!room}
              onClick={() => changeMyScore(1)}
              aria-label="Add 1 point"
            >
              +1 point
            </MeshButton>
            <MeshButton
              variant="secondary"
              disabled={!room}
              onClick={() => changeMyScore(2)}
              aria-label="Add 2 points"
            >
              +2
            </MeshButton>
            <MeshButton
              variant="secondary"
              disabled={!room}
              onClick={() => changeMyScore(-1)}
              aria-label="Remove 1 point"
            >
              −1
            </MeshButton>
          </div>

          <p className="scoreboard-notice" role="status" aria-live="polite">
            {notice}
          </p>
        </MeshSurface>

        <MeshSurface
          as="section"
          tone="raised"
          padding="lg"
          className="scoreboard-ledger-surface"
          aria-labelledby="ledger-title"
        >
          <div className="scoreboard-ledger-heading">
            <div>
              <p className="scoreboard-panel-label">Room ledger</p>
              <h2 id="ledger-title">Current standings</h2>
            </div>
            <span className="scoreboard-ledger-count">{players.length} players</span>
          </div>

          <ol className="scoreboard-ledger" aria-label="Live score ledger">
            {players.map((player, index) => (
              <li
                key={player.peerId}
                className={player.isMe ? "is-current-player" : undefined}
                data-player-id={player.peerId}
              >
                <span className="scoreboard-rank" aria-label={`Rank ${index + 1}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="scoreboard-player-name">
                  {player.name}
                  {player.isMe ? <span className="scoreboard-you">You</span> : null}
                </span>
                <strong aria-label={`${player.name}: ${pointCopy(player.score)}`}>
                  {player.score}
                </strong>
              </li>
            ))}
          </ol>

          <div className="scoreboard-ledger-footer">
            <span>Scores change only when someone in this room calls a point.</span>
            <MeshButton
              variant={resetArmed ? "danger" : "quiet"}
              size="sm"
              disabled={!room}
              onClick={resetBoard}
              aria-label={resetArmed ? "Confirm reset shared board" : "Reset shared board"}
            >
              {resetArmed ? "Confirm reset" : "Reset board"}
            </MeshButton>
          </div>
        </MeshSurface>
      </section>

      <section className="scoreboard-bottom-row" aria-label="Player and room details">
        <MeshSurface as="section" tone="quiet" padding="md" className="scoreboard-identity">
          <MeshNameInput
            value={namedPeer.name}
            onChange={namedPeer.setName}
            label="Player name"
            placeholder="Name on the board"
            maxLength={32}
            hint="This name is shared with the people in this room."
          />
        </MeshSurface>
        <aside className="scoreboard-room-note">
          <span className="scoreboard-room-note-mark" aria-hidden="true" />
          <p>
            The score stays in this room while its peers are connected. Invite the people you want
            on the board from the top bar.
          </p>
        </aside>
      </section>
    </MeshPage>
  );
}
