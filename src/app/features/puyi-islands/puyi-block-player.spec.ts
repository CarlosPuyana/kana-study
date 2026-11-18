import { TestBed } from '@angular/core/testing';
import {
  PUYI_AUDIO, PUYI_FINISH_GRACE_MS, PUYI_GAP_MS, PUYI_IMITATION_SECONDS, PUYI_LISTEN_MINUTES, PuyiBlockPlayer,
} from './puyi-block-player';

const a = { id: 'a', audioUrl: 'a.mp3' };
const b = { id: 'b', audioUrl: 'b.mp3' };

class FakeAudio {
  src = '';
  ended = false;
  paused = true;
  error: object | null = null;
  onended: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => { this.paused = false; });
  pause = vi.fn(() => { this.paused = true; this.onpause?.(); });
  load = vi.fn(() => { this.ended = false; this.error = null; });
  removeAttribute = vi.fn(() => { this.src = ''; });

  finish(): void {
    this.ended = true;
    this.paused = true;
    this.onended?.();
  }
}

describe('PuyiBlockPlayer', () => {
  let player: PuyiBlockPlayer;
  let audio: FakeAudio;
  let factory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    audio = new FakeAudio();
    factory = vi.fn(() => audio as unknown as HTMLAudioElement);
    TestBed.configureTestingModule({ providers: [PuyiBlockPlayer, { provide: PUYI_AUDIO, useValue: factory }] });
    player = TestBed.inject(PuyiBlockPlayer);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('starts only on request, uses one element and plays a block once', async () => {
    expect(factory).not.toHaveBeenCalled();
    player.start([a, b]);
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
    audio.finish();
    expect(player.phase()).toBe('gap');
    expect(player.playingId()).toBeNull();
    await vi.advanceTimersByTimeAsync(PUYI_GAP_MS - 1);
    expect(audio.src).toBe('a.mp3');
    expect(audio.play).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
    expect(player.position()).toBe(2);
    audio.finish();
    await vi.advanceTimersByTimeAsync(PUYI_GAP_MS * 2);
    expect(player.phase()).toBe('complete');
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe('');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('holds the current clip on pause and preserves the remaining silence', async () => {
    player.start([a, b]);
    await Promise.resolve();
    player.pause();
    expect(player.phase()).toBe('paused');
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
    audio.finish();
    await vi.advanceTimersByTimeAsync(1000);
    player.pause();
    await vi.advanceTimersByTimeAsync(10000);
    expect(player.position()).toBe(1);
    player.resume();
    await vi.advanceTimersByTimeAsync(PUYI_GAP_MS - 1001);
    expect(player.position()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
  });

  it('cancels a gap and stale callbacks on stop or changing to one clip', async () => {
    player.start([a, b]);
    await Promise.resolve();
    const stale = audio.onended;
    audio.finish();
    player.start([b], 'single');
    await Promise.resolve();
    stale?.();
    await vi.advanceTimersByTimeAsync(PUYI_GAP_MS);
    expect(player.mode()).toBe('single');
    expect(player.position()).toBe(1);
    expect(player.playingId()).toBe('b');
    player.stop();
    stale?.();
    expect(player.phase()).toBe('idle');
    expect(audio.src).toBe('');
  });

  it('offers retry on blocked playback and never skips the failed clip', async () => {
    audio.play.mockRejectedValueOnce({ name: 'NotAllowedError' });
    player.start([a, b]);
    await Promise.resolve();
    expect(player.phase()).toBe('blocked');
    expect(player.position()).toBe(1);
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
    audio.error = {};
    audio.onerror?.();
    expect(player.phase()).toBe('error');
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
  });

  it('ignores a play promise that settles after leaving the page', async () => {
    let resolve!: () => void;
    audio.play.mockReturnValueOnce(new Promise<void>(done => { resolve = done; }));
    player.start([a]);
    TestBed.resetTestingModule();
    resolve();
    await Promise.resolve();
    expect(player.phase()).toBe('idle');
    expect(audio.src).toBe('');
    expect(audio.paused).toBe(true);
  });

  it.each(PUYI_IMITATION_SECONDS)('waits %i seconds for each imitation, including the last', async seconds => {
    player.start([a, b], 'shadowing', seconds);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(12000);
    expect(player.playingId()).toBe('a');
    audio.finish();
    expect(player.phase()).toBe('gap');
    expect(player.selectedId()).toBe('a');
    await vi.advanceTimersByTimeAsync(seconds * 1000 - 1);
    expect(player.position()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
    audio.finish();
    expect(player.phase()).toBe('gap');
    expect(player.selectedId()).toBe('b');
    await vi.advanceTimersByTimeAsync(seconds * 1000);
    expect(player.phase()).toBe('complete');
    expect(player.canRepeat()).toBe(false);
    await vi.advanceTimersByTimeAsync(10000);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('holds the remaining imitation time and restarts the current clip on repeat', async () => {
    player.start([a, b], 'shadowing');
    await Promise.resolve();
    const oldEnded = audio.onended;
    audio.finish();
    await vi.advanceTimersByTimeAsync(3750);
    player.pause();
    await vi.advanceTimersByTimeAsync(15000);
    expect(player.position()).toBe(1);
    player.resume();
    await vi.advanceTimersByTimeAsync(1200);
    expect(player.phase()).toBe('gap');
    player.repeat();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(60);
    expect(audio.src).toBe('a.mp3');
    expect(player.playingId()).toBe('a');
    audio.finish();
    oldEnded?.();
    await vi.advanceTimersByTimeAsync(4999);
    expect(player.selectedId()).toBe('a');
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
  });

  it('ignores failed or ended callbacks from the previous clip and retries the current phrase', async () => {
    player.start([a, b], 'shadowing', 2);
    await Promise.resolve();
    const oldError = audio.onerror;
    const oldEnded = audio.onended;
    audio.finish();
    await vi.advanceTimersByTimeAsync(2000);
    audio.error = {};
    audio.ended = true;
    oldError?.();
    oldEnded?.();
    expect(player.phase()).toBe('playing');
    expect(player.selectedId()).toBe('b');
    audio.onerror?.();
    expect(player.phase()).toBe('error');
    expect(audio.src).toBe('');
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('b');
    expect(audio.src).toBe('b.mp3');
  });

  it('cancels an imitation callback when the player is destroyed', async () => {
    player.start([a, b], 'shadowing', 2);
    await Promise.resolve();
    audio.finish();
    TestBed.resetTestingModule();
    await vi.advanceTimersByTimeAsync(3000);
    expect(player.phase()).toBe('idle');
    expect(audio.src).toBe('');
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('plays A through E and repeats in order with silence at every transition', async () => {
    const block = [a, b, ...['c', 'd', 'e'].map(id => ({ id, audioUrl: id + '.mp3' }))];
    player.startContinuous(block, 5, 5);
    await Promise.resolve();
    for (const clip of [...block, ...block, ...block]) {
      expect(player.playingId()).toBe(clip.id);
      expect(audio.src).toBe(clip.audioUrl);
      audio.finish();
      expect(player.phase()).toBe('gap');
      expect(audio.paused).toBe(true);
      await vi.advanceTimersByTimeAsync(4999);
      expect(player.selectedId()).toBe(clip.id);
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(player.playingId()).toBe('a');
    expect(audio.play).toHaveBeenCalledTimes(16);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it.each(PUYI_LISTEN_MINUTES)('uses %i active minutes and finishes the current clip after expiry', async minutes => {
    player.startContinuous([a, b], minutes, 0);
    await Promise.resolve();
    expect(player.remainingMs()).toBe(minutes * 60000);
    vi.advanceTimersByTime(1000);
    expect(player.remainingMs()).toBe((minutes * 60 - 1) * 1000);
    vi.advanceTimersByTime(minutes * 60000 - 1000);
    expect(player.remainingMs()).toBe(0);
    expect(player.playingId()).toBe('a');
    audio.finish();
    expect(player.phase()).toBe('complete');
    vi.advanceTimersByTime(PUYI_FINISH_GRACE_MS);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('enforces the safety margin from the deadline and does not restart an overdue clip', async () => {
    player.startContinuous([a, b], 5, 2);
    await Promise.resolve();
    vi.advanceTimersByTime(5 * 60000 + PUYI_FINISH_GRACE_MS - 1);
    expect(player.playingId()).toBe('a');
    vi.advanceTimersByTime(1);
    expect(player.phase()).toBe('complete');
    expect(audio.src).toBe('');
    expect(audio.paused).toBe(true);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('freezes the budget during audio and silence and keeps the unfinished gap', async () => {
    player.startContinuous([a, b], 5, 5);
    await Promise.resolve();
    const loadsBeforePause = audio.load.mock.calls.length;
    vi.advanceTimersByTime(1210);
    player.pause();
    expect(audio.src).toBe('a.mp3');
    expect(player.remainingMs()).toBe(298790);
    vi.advanceTimersByTime(10000);
    expect(player.remainingMs()).toBe(298790);
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
    expect(audio.load).toHaveBeenCalledTimes(loadsBeforePause);
    audio.finish();
    vi.advanceTimersByTime(2000);
    player.pause();
    expect(player.remainingMs()).toBe(296790);
    vi.advanceTimersByTime(10000);
    expect(player.remainingMs()).toBe(296790);
    player.resume();
    await vi.advanceTimersByTimeAsync(2999);
    expect(player.phase()).toBe('gap');
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
    expect(player.remainingMs()).toBe(293790);
  });

  it('ends in silence with no next clip when time and gap expire together', async () => {
    player.startContinuous([a, b], 5, 2);
    await Promise.resolve();
    vi.advanceTimersByTime(298000);
    audio.finish();
    expect(player.phase()).toBe('gap');
    vi.advanceTimersByTime(2000);
    expect(player.phase()).toBe('complete');
    expect(player.remainingMs()).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('cannot start an overdue clip when callbacks are suspended', async () => {
    player.startContinuous([a, b], 5, 0);
    await Promise.resolve();
    audio.finish();
    vi.setSystemTime(Date.now() + 350000);
    await vi.advanceTimersByTimeAsync(1); // The overdue gap might be delivered before focus or the deadline timer.
    expect(player.phase()).toBe('complete');
    expect(audio.play).toHaveBeenCalledTimes(1);

    player.startContinuous([a, b], 5, 0);
    await Promise.resolve();
    vi.setSystemTime(Date.now() + 350000);
    player.reconcile();
    expect(player.phase()).toBe('complete');
    expect(audio.src).toBe('');
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('expires a loading clip before a delayed play promise can change the phase', async () => {
    let resolve!: () => void;
    audio.play.mockReturnValueOnce(new Promise<void>(done => { resolve = done; }));
    player.startContinuous([a, b], 5, 0);
    vi.setSystemTime(Date.now() + 300000);
    resolve();
    await Promise.resolve();
    expect(player.phase()).toBe('complete');
    expect(audio.src).toBe('');
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('times out a stalled load, freezes the clock on errors and retries the same clip', async () => {
    audio.play.mockReturnValueOnce(new Promise<void>(() => {}));
    player.startContinuous([a, b], 5, 0);
    vi.advanceTimersByTime(14999);
    expect(player.phase()).toBe('loading');
    vi.advanceTimersByTime(1);
    expect(player.phase()).toBe('error');
    vi.advanceTimersByTime(60000);
    expect(player.remainingMs()).toBe(285000);
    audio.play.mockRejectedValueOnce({ name: 'NotAllowedError' });
    player.resume();
    await Promise.resolve();
    expect(player.phase()).toBe('blocked');
    vi.advanceTimersByTime(60000);
    expect(player.remainingMs()).toBe(285000);
    player.resume();
    await Promise.resolve();
    expect(player.playingId()).toBe('a');
    audio.finish();
    await vi.advanceTimersByTimeAsync(1);
    expect(player.playingId()).toBe('b');
  });

  it('cancels loading and timed callbacks on stop, mode change and destruction', async () => {
    let resolve!: () => void;
    audio.play.mockReturnValueOnce(new Promise<void>(done => { resolve = done; }));
    player.startContinuous([a, b], 5, 0);
    player.stop();
    resolve();
    await Promise.resolve();
    expect(player.phase()).toBe('idle');
    expect(audio.src).toBe('');

    player.startContinuous([a, b], 5, 8);
    await Promise.resolve();
    audio.finish();
    player.start([b], 'shadowing', 2);
    await Promise.resolve();
    vi.advanceTimersByTime(8000);
    expect(player.playingId()).toBe('b');
    expect(player.remainingMs()).toBe(0);
    player.start([a]);
    await Promise.resolve();
    expect(player.mode()).toBe('block');
    player.startContinuous([b], 10, 2);
    await Promise.resolve();
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(10 * 60000);
    expect(player.phase()).toBe('idle');
    expect(audio.src).toBe('');
    expect(vi.getTimerCount()).toBe(0);
  });
});
