import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SessionHistoryService } from './session-history.service';

export type DailyLearningModule = 'kana' | 'kanji' | 'vocabulary';

const SPAIN_DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getSpainDayKey(date: Date): string {
  const parts = Object.fromEntries(
    SPAIN_DAY_FORMATTER.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );
  return `${parts['year']}-${parts['month']}-${parts['day']}`;
}

@Injectable({ providedIn: 'root' })
export class DailyLearningService {
  private readonly history = inject(SessionHistoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentTime = signal(new Date());

  readonly spainDay = computed(() => getSpainDayKey(this.currentTime()));

  constructor() {
    const refresh = () => this.refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    });
  }

  isCompletedToday(module: DailyLearningModule): boolean {
    const today = this.spainDay();
    return this.history.sessions().some(summary =>
      summary.module === module
      && summary.exercisesCompleted > 0
      && getSpainDayKey(new Date(summary.completedAt)) === today,
    );
  }

  refresh(now = new Date()): void {
    this.currentTime.set(now);
  }
}
