/** UI shortcuts only. Native controls, IME, dialogs and drawing keep their own keys. */
export function studyKeyboardAvailable(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey ||
      event.altKey || event.metaKey || event.shiftKey) return false;
  const interactive = 'input,textarea,select,button,a[href],summary,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="button"],[role="slider"],[role="combobox"],svg.writing-surface';
  const ownsKey = (target: EventTarget | null) => target instanceof Element && !!target.closest(interactive);
  if (event.composedPath().some(ownsKey) || ownsKey(event.target) || ownsKey(document.activeElement)) return false;
  return !document.querySelector('dialog[open],[role="dialog"][aria-modal="true"]');
}

/** Consume the key only when a real, currently available action is executed. */
export function runStudyShortcut(event: KeyboardEvent, reveal: (() => void) | null,
  answers: readonly (() => void)[]): void {
  if (!studyKeyboardAvailable(event)) return;
  const space = event.code === 'Space' || event.key === ' ';
  const action = space ? reveal : /^[1-9]$/.test(event.key) ? answers[Number(event.key) - 1] : undefined;
  if (!action) return;
  event.preventDefault();
  action();
}
