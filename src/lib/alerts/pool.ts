export async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0 || concurrency < 1) {
    return;
  }

  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item === undefined) {
          return;
        }
        // Each worker takes the next item only after its own send settles.
        // biome-ignore lint/performance/noAwaitInLoops: this is the concurrency cap
        await task(item);
      }
    }
  );

  await Promise.all(workers);
}
