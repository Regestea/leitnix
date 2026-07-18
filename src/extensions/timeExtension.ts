export function unixTimeNow(): number {
  return Math.floor(Date.now() / 1000);
}

export function hoursToSeconds(hours: number): number {
  return hours * 3600;
}

function startOfDayUnix(time: number): number {
  const d = new Date(time * 1000);
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000,
  );
}

export function calculateNextReviewTime(
  intervalSeconds: number,
  fromTime?: number,
): number {
  fromTime = fromTime ?? unixTimeNow();
  if (intervalSeconds >= 86400) {
    return startOfDayUnix(fromTime) + intervalSeconds;
  }
  return fromTime + intervalSeconds;
}
