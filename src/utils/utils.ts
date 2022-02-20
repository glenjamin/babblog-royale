export class Waiter {
  readonly constructedAt;
  constructor() {
    this.constructedAt = Date.now();
  }

  async wait(ms: number) {
    const remaining = ms - (Date.now() - this.constructedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
