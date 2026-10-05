import { afterNextRender, Directive, ElementRef, HostListener, inject, OnDestroy, output } from '@angular/core';

/** Small native focus boundary for the audited modal dialogs. */
@Directive({selector: '[appModalFocus]'})
export class ModalFocusDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previous = document.activeElement;
  readonly modalClosed = output<void>();
  private active=true;
  constructor() { afterNextRender(() => this.controls()[0]?.focus()); }
  private controls(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'))
      .filter(element => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
  }
  @HostListener('document:keydown', ['$event']) key(event: KeyboardEvent): void {
    if(!this.active)return;
    if (event.key === 'Escape') {event.preventDefault(); this.modalClosed.emit(); return;}
    if (event.key !== 'Tab') return;
    const controls = this.controls(), first = controls[0], last = controls.at(-1);
    if (!first) {event.preventDefault(); this.host.nativeElement.focus(); return;}
    if (!this.host.nativeElement.contains(document.activeElement) || event.shiftKey && document.activeElement === first
      || !event.shiftKey && document.activeElement === last) {
      event.preventDefault(); (event.shiftKey ? last : first)?.focus();
    }
  }
  @HostListener('document:focusin', ['$event']) focus(event: FocusEvent): void {
    if (this.active && event.target instanceof Node && !this.host.nativeElement.contains(event.target)) this.controls()[0]?.focus();
  }
  ngOnDestroy(): void { this.active=false; if (this.previous instanceof HTMLElement && this.previous.isConnected) this.previous.focus(); }
}
