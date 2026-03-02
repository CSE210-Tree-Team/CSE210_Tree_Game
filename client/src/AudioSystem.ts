class AudioSystem {
  private ambient: HTMLAudioElement | null = null;
  private fadeInterval: number | null = null;
  private currentTrack: string | null = null;
  private readonly defaultVolume = 0.4;

  private createAmbient(src: string) {
    this.ambient = new Audio(src);
    this.ambient.loop = true;
    this.ambient.volume = this.defaultVolume;
    this.currentTrack = src;
  }

  playAmbient(src: string) {
    // If new track, rebuild audio element
    if (!this.ambient || this.currentTrack !== src) {
      this.stopAmbient();
      this.createAmbient(src);
    }

    if (!this.ambient) return;

    // Cancel fade if active
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    this.ambient.volume = this.defaultVolume;

    if (!this.ambient.paused) return;

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

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.ambient.volume;
    const step = startVolume / (duration / 50);

    this.fadeInterval = window.setInterval(() => {
      if (!this.ambient) return;

      if (this.ambient.volume - step > 0) {
        this.ambient.volume -= step;
      } else {
        this.stopAmbient();
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, 50);
  }
}

export const audioSystem = new AudioSystem();