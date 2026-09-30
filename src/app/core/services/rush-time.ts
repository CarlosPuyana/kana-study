export const RUSH_IDLE_TIMEOUT_MS = 3 * 60 * 1000;

export function rushLocalDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class RushActiveTimer {
  private accumulatedMs = 0;
  private lastTick: number;
  private lastActivity: number;
  private visible = true;
  private needsActivity = false;

  constructor(private readonly now: () => number = Date.now) {
    this.lastTick = now();
    this.lastActivity = this.lastTick;
  }

  activity(): void {
    this.tick();
    this.lastActivity = this.now();
    this.lastTick = this.lastActivity;
    this.needsActivity = false;
  }

  setVisible(visible: boolean): void {
    this.tick();
    this.visible = visible;
    if (!visible) this.needsActivity = true;
    this.lastTick = this.now();
  }

  tick(): number {
    const current = this.now();
    if (this.visible && !this.needsActivity) {
      const activeUntil = Math.min(current, this.lastActivity + RUSH_IDLE_TIMEOUT_MS);
      this.accumulatedMs += Math.max(0, activeUntil - this.lastTick);
    }
    this.lastTick = current;
    return this.activeSeconds;
  }

  get activeSeconds(): number { return Math.floor(this.accumulatedMs / 1000); }
}
