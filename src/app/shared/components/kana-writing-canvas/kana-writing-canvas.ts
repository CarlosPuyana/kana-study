import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { KanaStrokeGlyph, WritingPoint, WritingStroke } from '../../../core/models/kana-writing.model';
import { KanaStrokesService } from '../../../core/services/kana-strokes.service';
import { TranslationService } from '../../../core/services/translation.service';

let nextCanvasId = 0;
@Component({
  selector: 'app-kana-writing-canvas', templateUrl: './kana-writing-canvas.html',
  styleUrl: './kana-writing-canvas.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanaWritingCanvas {
  readonly character = input.required<string>();
  readonly guide = input(true);
  readonly helpAvailable = input(true);
  readonly i18n = inject(TranslationService);
  private readonly data = inject(KanaStrokesService);
  private readonly destroy = inject(DestroyRef);
  readonly prefix = `kana-writing-${++nextCanvasId}`;
  readonly strokes = signal<readonly WritingStroke[]>([]);
  readonly glyphs = signal<readonly KanaStrokeGlyph[]>([]);
  readonly guideVisible = signal(true);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly animation = signal(false);
  private pointerId: number | null = null;
  private active: WritingPoint[] = [];
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  readonly drawnPaths = computed(() => this.strokes().map(stroke => stroke.map(p => `${p.x * 1024},${p.y * 1024}`).join(' ')));
  readonly modelStrokes = computed(() => {
    let order = 0;
    return this.glyphs().flatMap((glyph, glyphIndex) => {
      const ids = [...new Set(glyph.strokes.map(p => p.id.replace(/[a-z]+$/u, '')))];
      return ids.map(id => ({
        key: `${this.prefix}-${glyphIndex}-${id}`, order: order++,
        shape: glyph.strokes.filter(p => p.id.replace(/[a-z]+$/u, '') === id).map(p => p.value).join(' '),
        median: glyph.clipPaths.filter(p => p.id.replace(/[a-z]+$/u, '') === id).map(p => p.value).join(' '),
        transform: this.glyphs().length === 1 ? '' : `translate(${glyphIndex * 512} 256) scale(0.5)`,
      }));
    });
  });
  constructor() {
    effect(() => this.guideVisible.set(this.guide()));
    effect(() => {
      const character = this.character(), generation = ++this.generation;
      this.clear(); this.stopAnimation(); this.glyphs.set([]); this.loading.set(true); this.error.set(false);
      void this.data.load(character).then(glyphs => {
        if (generation === this.generation) {this.glyphs.set(glyphs); this.loading.set(false);}
      }).catch(() => {if (generation === this.generation) {this.error.set(true); this.loading.set(false);}});
    });
    this.destroy.onDestroy(() => {this.generation++; this.stopAnimation();});
  }
  pointerDown(event: PointerEvent): void {
    if (this.pointerId !== null || event.button !== 0) return;
    event.preventDefault(); this.pointerId = event.pointerId;
    (event.currentTarget as SVGSVGElement).setPointerCapture?.(event.pointerId);
    this.active = [this.point(event)]; this.strokes.update(strokes => [...strokes, [...this.active]]);
  }
  pointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    event.preventDefault(); this.active.push(this.point(event));
    this.strokes.update(strokes => [...strokes.slice(0, -1), [...this.active]]);
  }
  pointerUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    if (event.type === 'pointerup') this.pointerMove(event);
    this.pointerId = null; this.active = [];
  }
  undo(): void { if (this.pointerId === null) this.strokes.update(strokes => strokes.slice(0, -1)); }
  clear(): void {this.pointerId = null; this.active = []; this.strokes.set([]);}
  play(): void {
    if (!this.helpAvailable() || !this.modelStrokes().length) return;
    this.stopAnimation();
    // Recreate the animated paths so a second playback restarts every stroke.
    this.timer = setTimeout(() => {
      this.animation.set(true);
      this.timer = setTimeout(() => this.animation.set(false), this.modelStrokes().length * 700 + 100);
    }, 0);
  }
  private stopAnimation(): void {if (this.timer) clearTimeout(this.timer); this.animation.set(false);}
  private point(event: PointerEvent): WritingPoint {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    return {x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height), pressure: event.pressure, timestamp: event.timeStamp};
  }
}
