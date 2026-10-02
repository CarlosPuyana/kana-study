import {
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslationService } from "../../core/services/translation.service";
import { WorkspaceService } from "../../core/services/workspace.service";
import { MangaRepository } from "../../core/services/manga.repository";
import { MangaImportService } from "../../core/services/manga-import.service";
import { MangaError } from "../../core/services/mokuro-parser";
import { MangaProgress, MangaVolume } from "../../core/models/manga.model";
import { AccountControl } from "../../shared/components/account-control/account-control";
import { DictionaryInstallComponent } from './dictionary-install.component';
@Component({
  selector: "app-manga-page",
  imports: [RouterLink, AccountControl, DictionaryInstallComponent],
  styleUrl: "./manga.scss",
  template: `<main class="manga-library">
    <header>
      <a routerLink="/more" [queryParams]="{ from: 'manga' }">{{
        i18n.t("manga.modules")
      }}</a
      ><app-account-control />
    </header>
    <h1>{{ i18n.t("more.manga.title") }}</h1>
    <p>{{ i18n.t("manga.rights") }}</p>
    <app-dictionary-install />
    <label class="import-button" [class.disabled]="busy()"
      ><span>{{ i18n.t("manga.import") }}</span
      ><input
        type="file"
        accept=".zip,.cbz"
        [disabled]="busy()"
        (change)="importFile($event)"
    /></label>
    @if (busy()) {
      <p role="status">
        {{ i18n.t("manga.processing") }} {{ processed() }} / {{ total() }}
      </p>
    }
    @if (error()) {
      <p role="alert">{{ i18n.t("manga.error." + error()) }}</p>
    }
    @if (!busy() && !volumes().length) {
      <p>{{ i18n.t("manga.empty") }}</p>
    }
    <section class="library-grid">
      @for (volume of volumes(); track volume.id) {
        <article>
          @if (covers()[volume.id]) {
            <img
              class="cover"
              [src]="covers()[volume.id]"
              [alt]="volume.title"
            />
          }
          <h2>{{ volume.title }}</h2>
          @if (volume.seriesTitle !== volume.title) {
            <p>{{ volume.seriesTitle }}</p>
          }
          <p>
            {{ readPages(volume) }} / {{ volume.pageCount }}
            {{ i18n.t("manga.pages") }} · {{ size(volume.storageBytes) }} MB
          </p>
          <progress
            [value]="readPages(volume)"
            [max]="volume.pageCount"
          ></progress>
          <div class="actions">
            <a [routerLink]="['/manga/read', volume.id]">{{
              i18n.t(progress()[volume.id] ? "manga.continue" : "manga.read")
            }}</a
            ><button (click)="confirmDelete.set(volume)">
              {{ i18n.t("manga.delete") }}
            </button>
          </div>
        </article>
      }
    </section>
    @if (confirmDelete(); as volume) {
      <div class="modal-backdrop">
        <section role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <h2 id="delete-title">{{ i18n.t("manga.deleteConfirm") }}</h2>
          <p>{{ volume.title }}</p>
          <div class="actions">
            <button autofocus (click)="confirmDelete.set(null)">
              {{ i18n.t("common.cancel") }}</button
            ><button (click)="remove(volume)">
              {{ i18n.t("manga.delete") }}
            </button>
          </div>
        </section>
      </div>
    }
  </main>`,
})
export class MangaPage implements OnDestroy {
  readonly i18n = inject(TranslationService);
  private readonly workspace = inject(WorkspaceService);
  private readonly repository = inject(MangaRepository);
  private readonly importer = inject(MangaImportService);
  readonly volumes = signal<MangaVolume[]>([]);
  readonly covers = signal<Record<string, string>>({});
  readonly progress = signal<Record<string, MangaProgress>>({});
  readonly busy = signal(false);
  readonly error = signal("");
  readonly processed = signal(0);
  readonly total = signal(0);
  readonly confirmDelete = signal<MangaVolume | null>(null);
  private generation = 0;
  constructor() {
    effect(() => {
      const workspace = this.workspace.active();

      untracked(() => {
        this.confirmDelete.set(null);
        void this.load(workspace);
      });
    });
  }
  private clearCovers(): void {
    Object.values(this.covers()).forEach((url) => URL.revokeObjectURL(url));
    this.covers.set({});
  }
  private async load(workspace = this.workspace.active()): Promise<void> {
    const generation = ++this.generation;
    this.clearCovers();
    this.volumes.set([]);
    this.progress.set({});
    try {
      if (await this.repository.cleanup(workspace, this.importer.activeIds))
        this.error.set("interrupted");
      const volumes = await this.repository.volumes(workspace);
      if (generation !== this.generation) return;
      this.volumes.set(volumes);
      for (const volume of volumes) {
        const [page, progress] = await Promise.all([
          this.repository.page(volume.id, 0, workspace),
          this.repository.progress(volume.id, workspace),
        ]);
        if (generation !== this.generation) return;
        if (page)
          this.covers.update((covers) => ({
            ...covers,
            [volume.id]: URL.createObjectURL(page.image),
          }));
        if (progress)
          this.progress.update((all) => ({ ...all, [volume.id]: progress }));
      }
    } catch {
      if (generation === this.generation) this.error.set("interrupted");
    }
  }
  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.processed.set(0);
    this.total.set(0);
    try {
      await this.importer.import(file, (current, total) => {
        this.processed.set(current);
        this.total.set(total);
      });
      await this.load();
    } catch (error) {
      this.error.set(error instanceof MangaError ? error.code : "interrupted");
    } finally {
      this.busy.set(false);
      input.value = "";
    }
  }
  async remove(volume: MangaVolume): Promise<void> {
    this.confirmDelete.set(null);
    try {
      await this.repository.delete(volume.id);
      await this.load();
    } catch {
      this.error.set("interrupted");
    }
  }
  readPages(volume: MangaVolume): number {
    const saved = this.progress()[volume.id];
    return saved ? Math.min(saved.pageIndex + 1, volume.pageCount) : 0;
  }
  size(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1);
  }
  ngOnDestroy(): void {
    ++this.generation;
    this.clearCovers();
  }
}
