import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

export type SelectionIcon = 'target' | 'cards' | 'more';

@Component({
  selector: 'app-selection-card',
  imports: [RouterLink],
  templateUrl: './selection-card.html',
  styleUrl: './selection-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionCard {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly route = input.required<string>();
  readonly queryParams = input<Params | null>(null);
  readonly icon = input.required<SelectionIcon>();
}
