import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly total = input.required<number>();
  readonly kind = input<'new' | 'pending' | 'memorized'>('new');

  width(): number {
    if (this.total() <= 0) return 0;
    return Math.min(100, Math.max(0, (this.value() / this.total()) * 100));
  }
}
