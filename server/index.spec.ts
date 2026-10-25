import { describe, it, expect, vi } from "vitest";
import worker from "./index";

describe("Worker entry point", () => {
  it("should respond with ok for /health", async () => {
    const request = new Request("http://localhost/health");
    const response = await worker.fetch(request, {} as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("should route /api/room/:roomId/ws to Durable Object", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("DO response", { status: 200 }));
    const getMock = vi.fn().mockReturnValue({ fetch: fetchMock });
    const idFromNameMock = vi.fn().mockReturnValue("mock-id");

    const mockEnv = {
      GAME_SERVER: {
        idFromName: idFromNameMock,
        get: getMock,
      },
    };

    const request = new Request("http://localhost/api/room/test-room-123/ws", {
      headers: { Upgrade: "websocket" },
    });

    const response = await worker.fetch(request, mockEnv as any);
    expect(idFromNameMock).toHaveBeenCalledWith("test-room-123");
    expect(getMock).toHaveBeenCalledWith("mock-id");
    expect(fetchMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
  });
});
