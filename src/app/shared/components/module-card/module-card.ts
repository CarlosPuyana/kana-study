import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppModuleDefinition } from '../../../core/models/app-module.model';

@Component({
  selector: 'app-module-card',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './module-card.html',
  styleUrl: './module-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleCard {
  readonly definition = input.required<AppModuleDefinition>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly availableLabel = input.required<string>();
  readonly comingSoonLabel = input.required<string>();
}
