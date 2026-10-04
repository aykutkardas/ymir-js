const FILES = {
  select: 'sounds/select.wav',
  move: 'sounds/move.mp3',
  capture: 'sounds/capture.mp3',
};

let muted = false;

export const setMuted = (value: boolean) => {
  muted = value;
};

export const play = (name: keyof typeof FILES) => {
  if (muted) return;

  const audio = new Audio(FILES[name]);
  audio.volume = 0.5;
  // Browsers block audio until the first click; that is fine to ignore.
  audio.play().catch(() => {});
};
