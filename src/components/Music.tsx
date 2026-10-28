"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ak-music-on";
const BG_VOLUME = 0.35;
const BOSS_VOLUME = 0.4;
const SOUND_FILES = {
  damage: "/audio/damage-sound.mp3",
  bossDeath: "/audio/boss-death.mp3",
  win: "/audio/win-sound.mp3",
} as const;
type Sound = keyof typeof SOUND_FILES;

interface MusicContext {
  enabled: boolean;
  toggle: () => void;
  setBossMode: (active: boolean) => void;
  playSound: (sound: Sound, followedBy?: Sound) => void;
  stopSounds: () => void;
}

const Context = createContext<MusicContext>({
  enabled: true,
  toggle: () => {},
  setBossMode: () => {},
  playSound: () => {},
  stopSounds: () => {},
});

export function useMusic() {
  return useContext(Context);
}

/*
 * Two looping tracks, hard-switched (no crossfade, per design rules):
 * background.m4a everywhere, bossbattle.m4a while a boss fight runs.
 * Browsers block audio before a user gesture, so the first click/keypress
 * anywhere unlocks playback. Choice persists in localStorage.
 */
function storedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled);
  const unlockedRef = useRef(false);
  const bossModeRef = useRef(false);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const bossRef = useRef<HTMLAudioElement | null>(null);
  const soundsRef = useRef<Partial<Record<Sound, HTMLAudioElement>>>({});
  const winPlayingRef = useRef(false);

  const apply = useCallback(() => {
    const bg = bgRef.current;
    const boss = bossRef.current;
    if (!bg || !boss || !unlockedRef.current) return;
    if (!enabledRef.current || winPlayingRef.current) {
      bg.pause();
      boss.pause();
      return;
    }
    if (bossModeRef.current) {
      bg.pause();
      void boss.play().catch(() => {});
    } else {
      boss.pause();
      void bg.play().catch(() => {});
    }
  }, []);

  const stopSounds = useCallback(() => {
    Object.values(soundsRef.current).forEach((audio) => {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    });
    const wasPlayingWin = winPlayingRef.current;
    winPlayingRef.current = false;
    if (wasPlayingWin) apply();
  }, [apply]);

  const playSound = useCallback((sound: Sound, followedBy?: Sound) => {
    function play(name: Sound, after?: Sound) {
      if (!enabledRef.current || !unlockedRef.current) return;
      const audio = soundsRef.current[name];
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      if (name === "win") {
        winPlayingRef.current = true;
        apply();
      }
      const finish = () => {
        if (audio.onended !== finish) return;
        audio.onended = null;
        audio.onerror = null;
        if (name === "win") {
          winPlayingRef.current = false;
          apply();
        }
        if (after) play(after);
      };
      audio.onended = finish;
      audio.onerror = finish;
      void audio.play().catch(finish);
    }
    play(sound, followedBy);
  }, [apply]);

  useEffect(() => {
    const preference = storedPreference();
    enabledRef.current = preference;
    // Restore browser storage after the shared server/client initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(preference);
    const bg = new Audio("/audio/background.m4a");
    bg.loop = true;
    bg.volume = BG_VOLUME;
    bg.preload = "auto";
    const boss = new Audio("/audio/bossbattle.m4a");
    boss.loop = true;
    boss.volume = BOSS_VOLUME;
    boss.preload = "auto";
    bgRef.current = bg;
    bossRef.current = boss;
    for (const sound of Object.keys(SOUND_FILES) as Sound[]) {
      const audio = new Audio(SOUND_FILES[sound]);
      audio.preload = "auto";
      audio.volume = 0.65;
      soundsRef.current[sound] = audio;
    }

    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      apply();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      bg.pause();
      boss.pause();
      bgRef.current = null;
      bossRef.current = null;
      stopSounds();
      soundsRef.current = {};
    };
  }, [apply, stopSounds]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (!next) stopSounds();
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      apply();
      return next;
    });
  }, [apply, stopSounds]);

  const setBossMode = useCallback(
    (active: boolean) => {
      bossModeRef.current = active;
      apply();
    },
    [apply],
  );

  return (
    <Context.Provider value={{ enabled, toggle, setBossMode, playSound, stopSounds }}>
      {children}
    </Context.Provider>
  );
}
