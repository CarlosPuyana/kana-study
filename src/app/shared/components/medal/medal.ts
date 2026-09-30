import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-medal',
  templateUrl: './medal.html',
  styleUrl: './medal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Medal {
  readonly name = input.required<string>();
  readonly locked = input(true);
}
