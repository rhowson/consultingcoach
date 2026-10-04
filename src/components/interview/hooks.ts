"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewApi, TelemetryEvent } from "./client";

/**
 * Seconds left until `deadline` on the server's clock. Clock skew is measured
 * once per view (serverNow vs the browser clock when the view arrives).
 * `onExpire` fires once, from the timer, when the countdown reaches zero.
 */
export function useCountdown(deadline: string, serverNow: string, onExpire: () => void) {
  const end = Date.parse(deadline);
  // Pure first value (no Date.now() during render): the server's own view of time left.
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, (end - Date.parse(serverNow)) / 1000));
  const [announcement, setAnnouncement] = useState("");
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const skew = Date.parse(serverNow) - Date.now();
    let fired = false;
    let announced5 = false;
    let announced1 = false;
    const tick = () => {
      const left = Math.max(0, (end - (Date.now() + skew)) / 1000);
      setSecondsLeft(left);
      // Only announce thresholds we cross while watching (not on a reload well past them).
      if (left <= 300 && left > 290 && !announced5) {
        announced5 = true;
        setAnnouncement("5 minutes remaining in this section.");
      }
      if (left <= 60 && left > 50 && !announced1) {
        announced1 = true;
        setAnnouncement("1 minute remaining. Your answers will be submitted automatically at zero.");
      }
      if (left <= 0 && !fired) {
        fired = true;
        expireRef.current();
      }
    };
    const kickoff = setTimeout(tick, 0);
    const iv = setInterval(tick, 500);
    return () => {
      clearTimeout(kickoff);
      clearInterval(iv);
    };
  }, [end, serverNow]);

  return { secondsLeft, announcement };
}

/** Batches integrity events; flushes every few seconds and with sendBeacon when the page is hidden. */
export function useTelemetry(api: InterviewApi) {
  const queue = useRef<TelemetryEvent[]>([]);

  const flush = useCallback(
    (beacon = false) => {
      if (!queue.current.length) return;
      const batch = queue.current.splice(0, 50);
      api.telemetry(batch, beacon);
    },
    [api],
  );

  const track = useCallback(
    (ev: TelemetryEvent, urgent = false) => {
      queue.current.push(ev);
      if (urgent || queue.current.length >= 40) flush(urgent);
    },
    [flush],
  );

  useEffect(() => {
    const iv = setInterval(() => flush(), 4000);
    const onHide = () => flush(true);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(iv);
      window.removeEventListener("pagehide", onHide);
      flush(true);
    };
  }, [flush]);

  return track;
}
