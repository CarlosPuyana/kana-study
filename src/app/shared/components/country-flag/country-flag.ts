import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-country-flag',
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryFlag {
  readonly code = input.required<string>();
  readonly alt = input.required<string>();
  readonly size = input<'small' | 'medium' | 'large'>('medium');
}
