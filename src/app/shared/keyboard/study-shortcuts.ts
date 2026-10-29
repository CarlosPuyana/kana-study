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

// Additional ownership for sequential reveal/Next flows. The older quiz helper
// above retains its existing policy and numeric-answer behaviour.
const sequentialControls = 'a,.writing-surface,canvas,' + ['button','link','textbox','checkbox','radio','radiogroup','switch','tab','tablist','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','option','listbox','tree','treegrid','treeitem','grid','gridcell','slider','spinbutton','combobox','searchbox','scrollbar'].map(role=>`[role~="${role}"]`).join(',');
export function studyModalOpen(): boolean {
  return !!document.querySelector('dialog[open],[role="dialog"]:not([hidden]):not([aria-hidden="true"]),[role="alertdialog"]:not([hidden]):not([aria-hidden="true"])');
}
export function runRevealNextShortcut(event: KeyboardEvent, action: (() => void) | null, enter = false): void {
  if (!action || !(event.code === 'Space' || event.key === ' ' || enter && event.key === 'Enter') || !studyKeyboardAvailable(event)) return;
  const owns = (target: EventTarget | null) => target instanceof Element && !!target.closest(sequentialControls);
  if (studyModalOpen() || event.composedPath().some(owns) || owns(event.target) || owns(document.activeElement)) return;
  event.preventDefault();action();
}

/** Prevent native button auto-repeat as well as the document handler. */
export function guardStudyPrimaryKey(event: KeyboardEvent, blocked: boolean): void {
  if (!(event.code === 'Space' || event.key === ' ' || event.key === 'Enter')) return;
  if (blocked || studyModalOpen() || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) event.preventDefault();
}
