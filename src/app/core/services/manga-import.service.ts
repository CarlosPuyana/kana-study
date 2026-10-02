import { Injectable, inject } from '@angular/core';
import { MangaRepository } from './manga.repository';
import { WorkspaceService } from './workspace.service';
import { findMokuro, MangaError, mapMokuroImages, normalizeMangaPath, parseMokuro } from './mokuro-parser';
import { MangaVolume } from '../models/manga.model';
import { withMangaLock } from './manga-lock';
import { LocalWorkspaceId } from '../models/account.model';
export interface RemoteMangaInput { archiveBlob: Blob; mokuroBlob: Blob; seriesTitle: string; volumeTitle: string; archiveUrl: string; ocrUrl: string; signal: AbortSignal; workspace?: LocalWorkspaceId }
@Injectable({ providedIn: 'root' })
export class MangaImportService {
  private readonly repository = inject(MangaRepository);
  private readonly workspace = inject(WorkspaceService);
  readonly activeIds = new Set<string>();
  async import(file: File, progress: (current: number, total: number) => void): Promise<void> {
    await this.importArchive(file, progress);
  }
  importRemote(input: RemoteMangaInput, progress: (current: number, total: number) => void): Promise<string> {
    return this.importArchive(input.archiveBlob, progress, input);
  }
  private async importArchive(file: Blob, progress: (current: number, total: number) => void, remote?: RemoteMangaInput): Promise<string> {
    const workspace = remote?.workspace ?? this.workspace.active();
    return withMangaLock(workspace, async () => {
    remote?.signal.throwIfAborted();
    const { ZipReader, BlobReader, BlobWriter, TextWriter } = await import('@zip.js/zip.js');
    const zip = new ZipReader(new BlobReader(file), { useWebWorkers: false });
    const id = crypto.randomUUID();
    this.activeIds.add(id);
    try {
      const entries = (await zip.getEntries()).filter(entry => !entry.directory);
      const paths = entries.map(entry => normalizeMangaPath(entry.filename));
      const mokuroPath = remote ? 'remote.mokuro' : findMokuro(paths);
      const metadata = remote ? undefined : entries[paths.indexOf(mokuroPath)];
      if (!remote && !metadata?.getData) throw new MangaError('corrupt');
      const doc = parseMokuro(remote ? await remote.mokuroBlob.text() : await metadata!.getData!(new TextWriter()));
      remote?.signal.throwIfAborted();
      const images = mapMokuroImages(doc, paths, mokuroPath, !!remote);
      const bytes = images.reduce((sum, path) => sum + entries[paths.indexOf(path)].uncompressedSize, 0);
      let estimate: StorageEstimate | undefined;
      try { estimate = await navigator.storage?.estimate?.(); } catch { /* optional API */ }
      if (estimate?.quota !== undefined && estimate.usage !== undefined && bytes > estimate.quota - estimate.usage) throw new MangaError('quota');
      const now = new Date().toISOString();
      const { pages: _pages, ...mokuro } = doc;
      const volume: MangaVolume = { id, title: remote?.volumeTitle ?? (doc.volume || doc.title), seriesTitle: remote?.seriesTitle ?? doc.title, pageCount: images.length, storageBytes: bytes, mokuro, createdAt: now, updatedAt: now, complete: false, ...(remote ? {remoteSource:{archiveUrl:remote.archiveUrl,ocrUrl:remote.ocrUrl}} : {}) };
      remote?.signal.throwIfAborted();
      await this.repository.put('volumes', volume, workspace);
      progress(0, images.length);
      for (let index = 0; index < images.length; index++) {
        remote?.signal.throwIfAborted();
        const entry = entries[paths.indexOf(images[index])];
        if (!entry.getData) throw new MangaError('corrupt');
        const extension = images[index].split('.').pop()!.toLowerCase();
        const image = await entry.getData(new BlobWriter(`image/${extension === 'jpg' ? 'jpeg' : extension}`), { checkSignature: true, signal:remote?.signal });
        remote?.signal.throwIfAborted();
        await this.repository.put('pages', { volumeId: id, pageIndex: index, image, ocr: doc.pages[index] }, workspace);
        volume.updatedAt = new Date().toISOString();
        await this.repository.put('volumes', volume, workspace);
        progress(index + 1, images.length);
      }
      remote?.signal.throwIfAborted();
      await this.repository.put('volumes', { ...volume, complete: true }, workspace);
      remote?.signal.throwIfAborted();
      try { await navigator.storage?.persist?.(); } catch { /* best effort */ }
      remote?.signal.throwIfAborted();
      return id;
    } catch (error) {
      await this.repository.delete(id, workspace).catch(() => undefined);
      if (remote?.signal.aborted) throw new MangaError('cancelled');
      if (error instanceof MangaError) throw error;
      throw new MangaError(error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : 'corrupt');
    } finally { this.activeIds.delete(id); await zip.close().catch(() => undefined); }
    });
  }
}
