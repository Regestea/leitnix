export function unixTimeNow(): number {
  return Math.floor(Date.now() / 1000);
}

export function hoursToSeconds(hours: number): number {
  return hours * 3600;
}
