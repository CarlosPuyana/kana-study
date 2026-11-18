import { Directive, ElementRef, OnDestroy, inject, input, output, signal } from '@angular/core';

/** Touch/pen horizontal intent only; pan-y remains native and pointercancel never answers. */
@Directive({ selector: '[appRecallSwipe]', host: {
  '(pointerdown)': 'down($event)', '(pointermove)': 'move($event)', '(pointerup)': 'up($event)',
  '(pointercancel)': 'cancel()', '(lostpointercapture)': 'cancel()',
  '[class.swipe-enabled]': 'enabled()', '[class.drag-known]': 'drag() > 0', '[class.drag-unknown]': 'drag() < 0',
  '[style.touch-action]': 'enabled() ? "pan-y pinch-zoom" : null',
  '[style.--recall-drag]': 'drag() + "px"',
} })
export class RecallSwipe implements OnDestroy {
  readonly enabled = input(false);
  readonly phraseKey = input('');
  readonly recallSwipe = output<boolean>();
  readonly drag = signal(0);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private pointer?: { id: number; x: number; y: number; key: string };
  down(event: PointerEvent): void {
    if (!event.isPrimary || this.pointer) { this.cancel(); return; }
    if (!this.enabled() || !['touch', 'pen'].includes(event.pointerType) || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button,a,input,select,textarea,summary,details,[contenteditable]')) return;
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, key: this.phraseKey() };
    this.element.setPointerCapture?.(event.pointerId);
  }
  move(event: PointerEvent): void {
    const p = this.pointer;
    if (!p || p.id !== event.pointerId) return;
    if (!this.enabled() || p.key !== this.phraseKey()) { this.cancel(); return; }
    const dx = event.clientX - p.x, dy = event.clientY - p.y;
    if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx) * .8) { this.cancel(); return; }
    this.drag.set(Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.6 ? Math.max(-28, Math.min(28, dx / 4)) : 0);
  }
  up(event: PointerEvent): void {
    const p = this.pointer;
    if (!p || p.id !== event.pointerId) return;
    const dx = event.clientX - p.x, dy = event.clientY - p.y;
    const accepted = this.enabled() && p.key === this.phraseKey() && Math.abs(dx) >= 72 && Math.abs(dx) >= Math.abs(dy) * 1.6;
    this.cancel();
    if (accepted) this.recallSwipe.emit(dx > 0);
  }
  cancel(): void {
    const id = this.pointer?.id;
    this.pointer = undefined; this.drag.set(0);
    if (id !== undefined && this.element.hasPointerCapture?.(id)) this.element.releasePointerCapture(id);
  }
  ngOnDestroy(): void { this.cancel(); }
}
