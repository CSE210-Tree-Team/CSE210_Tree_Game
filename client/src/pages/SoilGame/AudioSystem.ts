import ambientFile from "./audio/test_audio.mp3";

class AudioSystem {
  private ambient: HTMLAudioElement | null = null;

  initAmbient() {
    if (this.ambient) return;

    this.ambient = new Audio(ambientFile);
    this.ambient.loop = true;
    this.ambient.volume = 0.4;
  }

  playAmbient() {
    this.initAmbient();
    this.ambient?.play().catch(() => {
      console.warn("Autoplay blocked until user interaction.");
    });
  }

  stopAmbient() {
    if (!this.ambient) return;
    this.ambient.pause();
    this.ambient.currentTime = 0;
  }

  fadeOut(duration = 2000) {
    if (!this.ambient) return;

    const step = this.ambient.volume / (duration / 50);

    const fade = setInterval(() => {
      if (!this.ambient) return;

      if (this.ambient.volume - step > 0) {
        this.ambient.volume -= step;
      } else {
        this.stopAmbient();
        clearInterval(fade);
      }
    }, 50);
  }
}

export const audioSystem = new AudioSystem();