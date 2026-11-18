/** Accumulate active intervals as in the P1 audio lab. */
export class ActiveClock {
  private total = 0;
  private since: number | null = null;

  start(): void {
    this.since ??= Date.now();
  }

  pause(): void {
    this.total = this.elapsed();
    this.since = null;
  }

  elapsed(): number {
    // Wall time lets a resumed browser account for time spent suspended.
    return this.total + (this.since === null ? 0 : Math.max(0, Date.now() - this.since));
  }
}
