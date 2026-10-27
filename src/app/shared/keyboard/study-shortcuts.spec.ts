import {runStudyShortcut} from './study-shortcuts';

describe('study keyboard ownership', () => {
  const reveal = vi.fn(), first = vi.fn(), second = vi.fn();
  const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document) => {
    const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...init});
    target.dispatchEvent(event);
    runStudyShortcut(event, reveal, [first, second]);
    return event;
  };
  beforeEach(() => { vi.clearAllMocks(); (document.activeElement as HTMLElement)?.blur?.(); });
  it('executes one real action and leaves unavailable keys and Space untouched', () => {
    expect(press(' ').defaultPrevented).toBe(true);
    expect(reveal).toHaveBeenCalledOnce();
    expect(press('1').defaultPrevented).toBe(true);
    expect(press('2').defaultPrevented).toBe(true);
    expect(press('3').defaultPrevented).toBe(false);
    const event = new KeyboardEvent('keydown', {key:' ', cancelable:true});
    runStudyShortcut(event, null, [first]);
    expect(event.defaultPrevented).toBe(false);
  });
  it.each(['input','textarea','select','button','a','summary','editable','inherited','textbox'])('respects %s and its descendants', tag => {
    const el = document.createElement(['editable','inherited','textbox'].includes(tag) ? 'div' : tag);
    if (tag==='a') el.setAttribute('href','#');
    if (tag==='editable'||tag==='inherited') el.setAttribute('contenteditable','true');
    if (tag==='textbox') el.setAttribute('role','textbox');
    const child = document.createElement('span'); el.append(child); document.body.append(el);
    try { expect(press(' ',{},tag==='inherited'?child:el).defaultPrevented).toBe(false); expect(reveal).not.toHaveBeenCalled(); }
    finally { el.remove(); }
  });
  it.each([{repeat:true},{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true},{shiftKey:true}])('ignores repeat/IME/modifiers %j', init => {
    expect(press(' ',init).defaultPrevented).toBe(false);
    press('1',init); expect(reveal).not.toHaveBeenCalled(); expect(first).not.toHaveBeenCalled();
  });
  it('does not consume an event twice or override an existing handler', () => {
    const event=press('1'); runStudyShortcut(event,reveal,[first]); expect(first).toHaveBeenCalledOnce();
  });
  it('respects focused controls even when the event is dispatched on document', () => {
    const button=document.createElement('button');document.body.append(button);button.focus();
    try { press(' '); expect(reveal).not.toHaveBeenCalled(); } finally {button.remove();}
  });
  it('does not act behind a modal or a native open dialog', () => {
    for(const native of [false,true]) {
      const dialog=document.createElement(native?'dialog':'section');
      if(native)dialog.setAttribute('open','');else {dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');}
      document.body.append(dialog);try {press(' ');press('1');expect(reveal).not.toHaveBeenCalled();expect(first).not.toHaveBeenCalled();}finally{dialog.remove();}
    }
  });
});
