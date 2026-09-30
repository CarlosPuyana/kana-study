import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-circle',
  templateUrl: './progress-circle.html',
  styleUrl: './progress-circle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircle {
  readonly percentage = input.required<number>();
  readonly radius = 52;
  readonly circumference = 2 * Math.PI * this.radius;

  dashOffset(): number {
    const safePercentage = Math.min(100, Math.max(0, this.percentage()));
    return this.circumference * (1 - safePercentage / 100);
  }
}
