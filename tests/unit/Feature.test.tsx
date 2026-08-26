import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMockRoom, linkMockRooms } from "@baditaflorin/mesh-common/testing";
import { Feature } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders a human match surface with an immediately usable score control", () => {
    const room = createMockRoom({ peerId: "alex", roomId: "opening-round" });
    render(<Feature room={room} config={config} />);

    expect(screen.getByRole("heading", { name: "Keep every point in view." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 1 point" })).toBeEnabled();
    expect(screen.getByRole("list", { name: "Live score ledger" })).toBeInTheDocument();
    expect(screen.getByLabelText("Player name")).toBeInTheDocument();
  });

  it("replicates a real score-map update into a linked peer ledger", async () => {
    const alex = createMockRoom({ peerId: "alex", roomId: "shared-round" });
    const bea = createMockRoom({ peerId: "bea", roomId: "shared-round" });
    const unlink = linkMockRooms(alex, bea);
    const alexView = render(<Feature room={alex} config={config} />);
    const beaView = render(<Feature room={bea} config={config} />);

    try {
      fireEvent.click(within(alexView.container).getByRole("button", { name: "Add 1 point" }));

      await waitFor(() => {
        expect(within(alexView.container).getByTestId("my-score")).toHaveTextContent("1");
        expect(
          within(beaView.container).getByRole("list", { name: "Live score ledger" }),
        ).toHaveTextContent("1");
      });
    } finally {
      unlink();
    }
  });

  it("keeps score changes disabled until the peer room is ready", () => {
    render(<Feature room={null} config={config} />);

    expect(screen.getByRole("button", { name: "Add 1 point" })).toBeDisabled();
    expect(screen.getAllByText("Joining room")).not.toHaveLength(0);
  });
});
