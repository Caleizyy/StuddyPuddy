export function getStatus() {
  return { status: 'ok', uptime: process.uptime() };
}
