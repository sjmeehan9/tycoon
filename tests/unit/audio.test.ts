import { describe, expect, it, vi } from 'vitest';

import { BrowserAudioManager } from '../../src/audio/AudioDirector';

describe('local audio manager', () => {
  it('keeps all media local, separate, and idle until explicitly requested', async () => {
    const handles: FakeAudio[] = [];
    const manager = new BrowserAudioManager('/tycoon/', (source) => {
      const handle = new FakeAudio(source);
      handles.push(handle);
      return handle;
    });

    expect(handles.map(({ source }) => source)).toEqual([
      '/tycoon/assets/audio/laneway-ambience.wav',
      '/tycoon/assets/audio/confirm.wav',
      '/tycoon/assets/audio/event.wav',
    ]);
    expect(handles.every(({ play }) => play.mock.calls.length === 0)).toBe(true);

    manager.setAmbienceEnabled(true);
    manager.playCue('event');
    await Promise.resolve();
    expect(handles[0]?.play).toHaveBeenCalledOnce();
    expect(handles[2]?.play).toHaveBeenCalledOnce();
    expect(handles[1]?.play).not.toHaveBeenCalled();

    manager.setAmbienceEnabled(false);
    manager.dispose();
    expect(handles[0]?.pause).toHaveBeenCalledTimes(2);
    expect(handles[1]?.pause).toHaveBeenCalledOnce();
    expect(handles[2]?.pause).toHaveBeenCalledOnce();
  });

  it('treats rejected or unavailable playback as safe muted operation', async () => {
    const handles: FakeAudio[] = [];
    const manager = new BrowserAudioManager('/', (source) => {
      const handle = new FakeAudio(source, true);
      handles.push(handle);
      return handle;
    });

    expect(() => {
      manager.setAmbienceEnabled(true);
      manager.playCue('confirm');
    }).not.toThrow();
    await Promise.resolve();
    expect(handles[0]?.play).toHaveBeenCalledOnce();
    expect(handles[1]?.play).toHaveBeenCalledOnce();
  });
});

class FakeAudio {
  public currentTime = 12;
  public loop = false;
  public preload = 'none';
  public volume = 1;
  public readonly pause = vi.fn();
  public readonly play: ReturnType<typeof vi.fn<() => Promise<void>>>;

  public constructor(
    public readonly source: string,
    reject = false,
  ) {
    this.play = vi.fn(() =>
      reject ? Promise.reject(new DOMException('Blocked', 'NotAllowedError')) : Promise.resolve(),
    );
  }
}
