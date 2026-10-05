import {
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from "@angular/core";
import { Router, RouterLink, convertToParamMap } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { parseRemoteLink } from '../../core/services/mokuro-remote-import.service';
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
  imports: [FormsModule, RouterLink, AccountControl, DictionaryInstallComponent],
  styleUrls: ["./manga.scss", "./manga-library.scss"],
  template: `<main class="manga-library">
    <header>
      <a routerLink="/more" [queryParams]="{ from: 'manga' }">{{
        i18n.t("manga.modules")
      }}</a
      ><app-account-control />
    </header>
    <section class="manga-hero"><span class="eyebrow">{{i18n.t("more.manga.title")}}</span><h1>{{i18n.t("manga.landing.title")}}</h1><p>{{i18n.t("manga.landing.intro")}}</p><div class="actions"><button class="primary-action" [disabled]="busy()" (click)="fileInput.click()">{{i18n.t("manga.landing.add")}}</button><a routerLink="/manga/guide">{{i18n.t("manga.landing.how")}} →</a></div></section><section class="manga-steps">@for(step of [1,2,3];track step){<article><div class="step-art" aria-hidden="true">@switch(step){@case(1){<span class="file-art">ZIP / CBZ</span>}@case(2){<span class="bubble-art">何してるの？</span>}@case(3){<span class="word-art">食べなかった → 食べる</span>}}</div><h2>{{step}} · {{i18n.t("manga.landing.step"+step)}}</h2></article>}</section>
    <details class="remote-entry"><summary>{{i18n.t('manga.remote.openLink')}}</summary>
      <p>{{i18n.t('manga.remote.linkHelp')}}</p><form (ngSubmit)="openRemote()">
        <label>{{i18n.t('manga.remote.archiveUrl')}}<input name="cbz" type="url" required [(ngModel)]="remoteCbz" /></label>
        <label>{{i18n.t('manga.remote.manifestUrl')}}<input name="manifest" type="url" required [(ngModel)]="remoteManifest" /></label>
        <label>{{i18n.t('manga.remote.coverUrl')}}<input name="cover" type="url" [(ngModel)]="remoteCover" /></label>
        @if(remoteInvalid()){<p role="alert">{{i18n.t('manga.remote.invalidLink')}}</p>}
        <button type="submit" [disabled]="busy()">{{i18n.t('manga.remote.openLink')}}</button>
      </form>
    </details>
    <p>{{ i18n.t("manga.rights") }}</p>
    <app-dictionary-install />
    <input hidden [attr.aria-label]="i18n.t('manga.landing.add')"
        #fileInput type="file"
        accept=".zip,.cbz"
        [disabled]="busy()"
        (change)="importFile($event)"
    />
    @if (busy()) {
      <p role="status">
        {{ i18n.t("manga.processing") }} {{ processed() }} / {{ total() }}
      </p>
    }
    @if (error()) {
      <p role="alert">{{ i18n.t("manga.error." + error()) }}</p>
    }
    @if (!busy() && !volumes().length) {
      <section class="empty-library"><div class="file-art" aria-hidden="true">＋</div><h2>{{i18n.t("manga.landing.empty")}}</h2><p>{{i18n.t("manga.landing.emptyHelp")}}</p><div class="actions"><button class="primary-action" (click)="fileInput.click()">{{i18n.t("manga.landing.add")}}</button><a routerLink="/manga/guide">{{i18n.t("manga.landing.how")}}</a></div></section>
    }
    <h2 class="library-heading">{{i18n.t("manga.library")}}</h2><section class="library-grid">
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
            [attr.aria-label]="i18n.t('manga.landing.progress')" [value]="readPages(volume)"
            [max]="volume.pageCount"
          ></progress>
          <div class="actions">
            <a [routerLink]="['/manga/read', volume.id]">{{
              i18n.t(progress()[volume.id] ? "manga.continue" : "manga.read")
            }}</a
            ><details class="volume-menu"><summary [attr.aria-label]="i18n.t('manga.landing.options')">⋯</summary><button (click)="confirmDelete.set(volume)">{{i18n.t("manga.delete")}}</button></details>
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
  private readonly router=inject(Router);
  remoteCbz='';remoteManifest='';remoteCover='';readonly remoteInvalid=signal(false);
  openRemote():void {
    this.remoteInvalid.set(false);
    try {
      const link=parseRemoteLink(convertToParamMap({cbz:this.remoteCbz.trim(),manifest:this.remoteManifest.trim(),...(this.remoteCover.trim()?{cover:this.remoteCover.trim()}:{})}));
      void this.router.navigate(['/upload'],{queryParams:{...link}});
    }catch{this.remoteInvalid.set(true);}
  }

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
