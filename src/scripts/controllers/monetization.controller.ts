import {
  MonetizationPendingEvent,
  MonetizationProgressEvent,
  MonetizationStartEvent,
  MonetizationStopEvent
} from '../models';

type Callback = ((e) => void) | null;

class MonetizationController {
  available = false;
  enabled = false;
  paid = false;
  total = 0;
  tag;

  mockInterval;

  callbacks: Record<string, Callback> = {
    'pending' : null,
    'start': null,
    'progress': null,
    'stop': null,
  }

  constructor() {
    window.addEventListener('load', () => {
      if (document.monetization) {
        this.tag = document.querySelector('meta[name="monetization"]');
        if (this.tag) {
          this.available = true;
          this.enabled = true;
          document.monetization.addEventListener('monetizationpending', e => this.onPending(e));
          document.monetization.addEventListener('monetizationstart', e => this.onStart(e));
          document.monetization.addEventListener('monetizationprogress', e => this.onProgress(e));
          document.monetization.addEventListener('monetizationstop', e => this.onStop(e));
        }
      }
    });
  }

  onPending(e: MonetizationPendingEvent) {
    if (this.callbacks.pending) {
      this.callbacks.pending(e);
    }
  }

  onStart(e: MonetizationStartEvent) {
    this.paid = true;
    if (this.callbacks.start) {
      this.callbacks.start(e);
    }
  }

  onProgress(e: MonetizationProgressEvent) {
    this.total += Number(e.detail.amount);
    if (this.callbacks.progress) {
      this.callbacks.progress(e);
    }
  }

  onStop(e: MonetizationStopEvent) {
    this.paid = false;
    if (this.callbacks.stop) {
      this.callbacks.stop(e);
    }
  }

  enable() {
    if (this.available && !this.enabled) {
      document.head.appendChild(this.tag);
      this.enabled = true;
    }
  }

  disable() {
    if (this.available && this.enabled) {
      this.tag.remove()
      this.enabled = false;
    }
  }

  mockStart() {
    if (!this.paid) {
      this.onStart({} as MonetizationStartEvent);
      this.mockInterval = setInterval(() => this.onProgress({detail: {amount: '0.00001'}} as MonetizationProgressEvent), 1000);
    }
  }

  mockStop() {
    if (this.paid) {
      clearInterval(this.mockInterval);
      this.onStop({} as MonetizationStopEvent);
    }
  }
}

export const monetizationController = new MonetizationController();
