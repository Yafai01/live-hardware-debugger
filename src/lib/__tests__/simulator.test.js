import { describe, expect, it } from "vitest";
import { isWebSerialSupported } from "../serial";
import { simulatorReply } from "../simulator";

describe("simulatorReply", () => {
  it("handles START/STOP/STATUS case-insensitively", () => {
    const state = { running: true, targetRpm: 3000 };
    expect(JSON.parse(simulatorReply("stop", state))).toEqual({ ack: "STOP" });
    expect(state.running).toBe(false);
    expect(JSON.parse(simulatorReply("STATUS", state)).status).toBe("stopped");
    simulatorReply("START", state);
    expect(state.running).toBe(true);
  });

  it("handles JSON commands and reports errors", () => {
    const state = { running: true, targetRpm: 3000 };
    expect(JSON.parse(simulatorReply('{"set_rpm":1500.6}', state))).toEqual({
      ack: "set_rpm",
      value: 1501,
    });
    expect(state.targetRpm).toBe(1501);
    expect(JSON.parse(simulatorReply('{"ping":true}', state))).toEqual({ pong: true });
    expect(JSON.parse(simulatorReply("{bad", state)).error).toBeTruthy();
    expect(JSON.parse(simulatorReply("FOO", state)).error).toMatch(/unknown/);
  });
});

describe("isWebSerialSupported", () => {
  it("detects the Web Serial API", () => {
    expect(isWebSerialSupported({ serial: {} })).toBe(true);
    expect(isWebSerialSupported({})).toBe(false);
    expect(isWebSerialSupported(undefined)).toBe(false);
  });
});
