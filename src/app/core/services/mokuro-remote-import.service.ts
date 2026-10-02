import { Injectable, inject } from "@angular/core";
import { ParamMap } from "@angular/router";
import { MangaImportService } from "./manga-import.service";
import { MangaRepository } from "./manga.repository";
import { WorkspaceService } from "./workspace.service";
import { LocalWorkspaceId } from "../models/account.model";
import { MangaVolume } from "../models/manga.model";
export class RemoteImportError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export interface RemoteImportLink {
  cbz: string;
  manifest: string;
  cover?: string;
}
export interface RemoteManifest {
  series: string;
  volume: string;
  archiveUrl: string;
  ocrUrl: string;
  size?: number;
  coverUrl?: string;
}
export interface RemotePreview {
  manifest: RemoteManifest;
  existing?: MangaVolume;
}
export interface RemoteDownloadProgress {
  received: number;
  total: number | null;
}
const MOKURO_RELAY_BASE =
  "https://kana-study-mokuro-relay.carlospuyana.workers.dev";

function remoteRequestUrl(url: string): string {
  const target = new URL(url);

  if (target.protocol === "https:" && target.hostname === "mokuro.moe") {
    const relay = new URL("/proxy", MOKURO_RELAY_BASE);
    relay.searchParams.set("url", target.href);
    return relay.href;
  }

  return target.href;
}
export function remoteHttpUrl(value: string, base?: string): string {
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
    url.hash = "";
    return url.href;
  } catch {
    throw new RemoteImportError("invalidLink");
  }
}
export function parseRemoteLink(params: ParamMap): RemoteImportLink {
  const cbz = params.get("cbz"),
    manifest = params.get("manifest");
  if (!cbz || !manifest) throw new RemoteImportError("invalidLink");
  const manifestUrl = remoteHttpUrl(manifest);
  const cover = params.get("cover");
  return {
    cbz: remoteHttpUrl(cbz),
    manifest: manifestUrl,
    ...(cover ? { cover: remoteHttpUrl(cover, manifestUrl) } : {}),
  };
}
export function parseRemoteManifest(
  value: unknown,
  link: RemoteImportLink,
): RemoteManifest {
  if (!value || typeof value !== "object")
    throw new RemoteImportError("manifestIncompatible");
  const data = value as Record<string, unknown>;
  if (
    data["version"] !== 1 ||
    typeof data["series"] !== "string" ||
    !data["series"].trim() ||
    typeof data["volume"] !== "string" ||
    !data["volume"].trim()
  )
    throw new RemoteImportError("manifestIncompatible");
  const archive = data["archive"] as
    | { url?: unknown; size?: unknown }
    | undefined;
  if (
    archive &&
    (typeof archive !== "object" || typeof archive.url !== "string")
  )
    throw new RemoteImportError("manifestIncompatible");
  const ocr = data["ocr"] as { url?: unknown } | undefined;
  if (!ocr || typeof ocr.url !== "string" || !ocr.url)
    throw new RemoteImportError("ocrUnavailable");
  const archiveUrl = archive
    ? remoteHttpUrl(archive.url as string, link.manifest)
    : link.cbz;
  if (archiveUrl !== link.cbz) throw new RemoteImportError("invalidLink");
  if (
    archive?.size !== undefined &&
    (typeof archive.size !== "number" ||
      !Number.isFinite(archive.size) ||
      archive.size < 0)
  )
    throw new RemoteImportError("manifestIncompatible");
  let coverUrl: string | undefined;
  try {
    const cover = data["cover"] as { url?: unknown } | undefined;
    coverUrl =
      typeof cover?.url === "string"
        ? remoteHttpUrl(cover.url, link.manifest)
        : link.cover;
  } catch {
    /* Optional preview cover never blocks import. */
  }
  return {
    series: data["series"],
    volume: data["volume"],
    archiveUrl,
    ocrUrl: remoteHttpUrl(ocr.url, link.manifest),
    ...(typeof archive?.size === "number" ? { size: archive.size } : {}),
    ...(coverUrl ? { coverUrl } : {}),
  };
}
@Injectable({ providedIn: "root" })
export class MokuroRemoteImportService {
  private readonly repository = inject(MangaRepository);
  private readonly importer = inject(MangaImportService);
  private readonly workspace = inject(WorkspaceService);
  private async response(
    url: string,
    signal: AbortSignal,
    errorCode: string,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(remoteRequestUrl(url), {
        signal,
        credentials: "omit",
      });
    } catch {
      throw new RemoteImportError(signal.aborted ? "cancelled" : "network");
    }
    if (response.status === 401 || response.status === 403)
      throw new RemoteImportError("auth");
    if (!response.ok) throw new RemoteImportError(errorCode);
    return response;
  }
  private async existing(
    manifest: RemoteManifest,
    workspace: LocalWorkspaceId,
  ): Promise<MangaVolume | undefined> {
    return (await this.repository.volumes(workspace)).find(
      (volume) =>
        volume.remoteSource?.archiveUrl === manifest.archiveUrl ||
        (!volume.remoteSource &&
          volume.seriesTitle === manifest.series &&
          volume.title === manifest.volume),
    );
  }
  async preview(
    link: RemoteImportLink,
    signal: AbortSignal,
    workspace = this.workspace.active(),
  ): Promise<RemotePreview> {
    const response = await this.response(
      link.manifest,
      signal,
      "manifestUnavailable",
    );
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new RemoteImportError(
        signal.aborted ? "cancelled" : "manifestIncompatible",
      );
    }
    const manifest = parseRemoteManifest(value, link);
    signal.throwIfAborted();
    return { manifest, existing: await this.existing(manifest, workspace) };
  }
  private async download(
    url: string,
    signal: AbortSignal,
    code: string,
    progress: (value: RemoteDownloadProgress) => void,
  ): Promise<Blob> {
    const response = await this.response(url, signal, code);
    const length = Number(response.headers.get("Content-Length"));
    const total = Number.isFinite(length) && length > 0 ? length : null;
    progress({ received: 0, total });
    try {
      if (!response.body) return await response.blob();
      const reader = response.body.getReader();
      const chunks: ArrayBuffer[] = [];
      let received = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          signal.throwIfAborted();
          chunks.push(value.slice().buffer);
          received += value.byteLength;
          progress({ received, total });
        }
      } finally {
        reader.releaseLock();
      }
      return new Blob(chunks);
    } catch {
      throw new RemoteImportError(signal.aborted ? "cancelled" : "network");
    }
  }
  async import(
    manifest: RemoteManifest,
    signal: AbortSignal,
    downloadProgress: (
      phase: "archive" | "ocr",
      progress: RemoteDownloadProgress,
    ) => void,
    processing: (current: number, total: number) => void,
    workspace = this.workspace.active(),
  ): Promise<string> {
    const existing = await this.existing(manifest, workspace);
    if (existing) return existing.id;
    const archiveBlob = await this.download(
      manifest.archiveUrl,
      signal,
      "archiveDownload",
      (value) => downloadProgress("archive", value),
    );
    const mokuroBlob = await this.download(
      manifest.ocrUrl,
      signal,
      "ocrDownload",
      (value) => downloadProgress("ocr", value),
    );
    signal.throwIfAborted();
    return this.importer.importRemote(
      {
        archiveBlob,
        mokuroBlob,
        seriesTitle: manifest.series,
        volumeTitle: manifest.volume,
        archiveUrl: manifest.archiveUrl,
        ocrUrl: manifest.ocrUrl,
        signal,
        workspace,
      },
      processing,
    );
  }
}
