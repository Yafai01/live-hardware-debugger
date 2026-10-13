import { describe, expect, it } from "vitest";
import {
  appendFrame,
  appendSamples,
  createLineSplitter,
  createSeries,
  extractMetrics,
  parseJsonLine,
} from "../telemetry";

describe("createLineSplitter", () => {
  it("returns complete lines and buffers partial ones across chunks", () => {
    const s = createLineSplitter();
    expect(s.push('{"temp":2')).toEqual([]);
    expect(s.push('4.5}\n{"rpm"')).toEqual(['{"temp":24.5}']);
    expect(s.push(":3000}\n")).toEqual(['{"rpm":3000}']);
  });

  it("handles CRLF endings and drops empty lines", () => {
    const s = createLineSplitter();
    expect(s.push("OK\r\n\r\nREADY\r\n")).toEqual(["OK", "READY"]);
  });

  it("forces out an over-long line instead of growing forever", () => {
    const s = createLineSplitter(8);
    expect(s.push("abcdefghijkl")).toEqual(["abcdefgh"]);
    expect(s.flush()).toEqual(["ijkl"]);
    expect(s.flush()).toEqual([]);
  });
});

describe("parseJsonLine", () => {
  it("parses JSON objects", () => {
    expect(parseJsonLine(' {"temp": 24.5} ')).toEqual({ temp: 24.5 });
  });

  it("returns null for plain text, arrays, primitives and malformed JSON", () => {
    expect(parseJsonLine("hello")).toBeNull();
    expect(parseJsonLine("[1,2]")).toBeNull();
    expect(parseJsonLine("42")).toBeNull();
    expect(parseJsonLine('{"temp":')).toBeNull();
    expect(parseJsonLine(undefined)).toBeNull();
  });
});

describe("extractMetrics", () => {
  it("reads temp, volt and rpm including aliases and numeric strings", () => {
    expect(extractMetrics({ temperature: 21, voltage: "3.30", rpm: 2900 })).toEqual({
      temp: 21,
      volt: 3.3,
      rpm: 2900,
    });
  });

  it("marks missing or non-numeric values as null rather than 0", () => {
    expect(extractMetrics({ temp: 22, rpm: "fast" })).toEqual({ temp: 22, volt: null, rpm: null });
  });

  it("returns null when no known metric is present", () => {
    expect(extractMetrics({ ack: "START" })).toBeNull();
    expect(extractMetrics({ temp: null, volt: NaN })).toBeNull();
    expect(extractMetrics(null)).toBeNull();
  });
});

describe("appendFrame", () => {
  it("appends a frame without mutating the input and keeps a rolling window", () => {
    let series = createSeries();
    const original = series;
    for (let i = 0; i < 5; i++) {
      series = appendFrame(series, `t${i}`, { temp: i, volt: null, rpm: i * 100 }, 3);
    }
    expect(original.labels).toEqual([]);
    expect(series.labels).toEqual(["t2", "t3", "t4"]);
    expect(series.temp).toEqual([2, 3, 4]);
    expect(series.volt).toEqual([null, null, null]);
    expect(series.rpm).toEqual([200, 300, 400]);
  });
});

describe("appendSamples", () => {
  it("keeps only the most recent samples", () => {
    expect(appendSamples([1, 2, 3], new Uint8Array([4, 5]), 4)).toEqual([2, 3, 4, 5]);
    expect(appendSamples([1], [7, 8, 9, 10, 11], 3)).toEqual([9, 10, 11]);
  });
});
