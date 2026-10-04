import { Howl } from "howler";

const WoodHardHitVoice = new Howl({
  src: ["/assets/voices/wood-hard-hit.wav"],
});

const MoveVoice = new Howl({
  src: ["/assets/voices/move-sound.mp3"],
});

const KnifeThrustVoice = new Howl({
  src: ["/assets/voices/knife-thrust-into-wall.mp3"],
});

const voices = {
  select: WoodHardHitVoice,
  move: MoveVoice,
  destroy: KnifeThrustVoice,
};

const getVoice = (name) => voices[name];

export default getVoice;
