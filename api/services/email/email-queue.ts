// Default pacing between sends, sized for the provider's rate limit.
const SEND_INTERVAL_MS = 1100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createQueue<T>(
  sendFn: (job: T) => Promise<void>,
  sendIntervalMs: number = SEND_INTERVAL_MS,
): { enqueue: (job: T) => void } {
  const queue: T[] = [];
  let sending = false;

  const process = async (): Promise<void> => {
    if (sending) return;
    sending = true;

    while (queue.length > 0) {
      const job = queue.shift()!;

      try {
        await sendFn(job);
        console.log('Email queued successfully');
      }
      catch (err) {
        if (err.statusCode === 429) {
          console.warn('Email provider throttled — retrying in 2s');
          await sleep(2000);
          queue.unshift(job);
          continue;
        }
        else {
          console.error('Email failed permanently:', err);
        }
      }

      if (sendIntervalMs > 0) {
        await sleep(sendIntervalMs);
      }
    }

    sending = false;
  };

  const enqueue = (job: T): void => {
    queue.push(job);
    process();
  };

  return { enqueue };
}
