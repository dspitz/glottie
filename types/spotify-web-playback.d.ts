declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

declare namespace Spotify {
  interface PlaybackState {
    context: {
      uri: string;
      metadata: any;
    };
    disallows: {
      pausing: boolean;
      peeking_next: boolean;
      peeking_prev: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
    };
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      next_tracks: Track[];
      previous_tracks: Track[];
    };
  }

  interface Track {
    id: string;
    uri: string;
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: Image[];
    };
    artists: Artist[];
  }

  interface Artist {
    uri: string;
    name: string;
  }

  interface Image {
    url: string;
    size?: string;
  }

  interface Device {
    device_id: string;
  }

  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  class Player {
    constructor(init: PlayerInit);
    
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, cb: (data: any) => void): void;
    removeListener(event: string, cb?: (data: any) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }
}

export {};