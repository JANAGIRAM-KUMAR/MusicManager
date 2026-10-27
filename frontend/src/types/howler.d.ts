declare module 'howler' {
  export interface HowlOptions {
    src: string | string[];
    html5?: boolean;
    preload?: boolean | string;
    volume?: number;
    onload?: () => void;
    onplay?: (id?: number) => void;
    onpause?: (id?: number) => void;
    onend?: (id?: number) => void;
    onloaderror?: (id?: number, error?: unknown) => void;
    onplayerror?: (id?: number, error?: unknown) => void;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(id?: number): number;
    pause(id?: number): void;
    stop(id?: number): void;
    seek(seek?: number, id?: number): number | Howl;
    duration(id?: number): number;
    volume(vol?: number, id?: number): number | Howl;
    mute(muted?: boolean, id?: number): Howl;
    unload(): void;
    on(event: string, handler: (...args: any[]) => void, id?: number): void;
    once(event: string, handler: (...args: any[]) => void, id?: number): void;
    off(event: string, handler?: (...args: any[]) => void, id?: number): void;
  }
}
