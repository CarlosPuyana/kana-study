import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MedalIcon } from '../../../core/models/medal.model';

@Component({
  selector: 'app-medal-badge',
  templateUrl: './medal-badge.html',
  styleUrl: './medal-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedalBadge {
  readonly icon = input.required<MedalIcon>();
  readonly locked = input(false);
  readonly size = input<'small' | 'large'>('large');
}
