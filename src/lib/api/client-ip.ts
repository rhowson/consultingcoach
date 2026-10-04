/**
 * Client IP for rate limiting. Railway's edge proxy sets X-Forwarded-For; the
 * first entry is the original client. Not trusted for anything but throttling.
 */
export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
