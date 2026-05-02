export type EventQueue<T> = {
  push: (event: T) => void;
  close: (err?: Error) => void;
  iterate: (opts?: { signal?: AbortSignal }) => AsyncIterable<T>;
};

export function createEventQueue<T>(): EventQueue<T> {
  const buffer: T[] = [];
  let pending: ((value: IteratorResult<T>) => void) | null = null;
  let pendingReject: ((err: unknown) => void) | null = null;
  let done = false;
  let error: Error | null = null;

  const push: EventQueue<T>['push'] = (event) => {
    if (done) return;
    if (pending) {
      const resolve = pending;
      pending = null;
      pendingReject = null;
      resolve({ value: event, done: false });
      return;
    }
    buffer.push(event);
  };

  const close: EventQueue<T>['close'] = (err) => {
    if (done) return;
    done = true;
    if (err) error = err;
    if (pending) {
      const resolve = pending;
      const reject = pendingReject;
      pending = null;
      pendingReject = null;
      if (err && reject) reject(err);
      else resolve({ value: undefined as T, done: true });
    }
  };

  async function* iterate(opts?: {
    signal?: AbortSignal;
  }): AsyncGenerator<T, void, void> {
    const signal = opts?.signal;
    const onAbort = () => {
      close();
    };
    if (signal) {
      if (signal.aborted) {
        close();
        return;
      }
      signal.addEventListener('abort', onAbort);
    }
    try {
      while (true) {
        if (buffer.length > 0) {
          const next = buffer.shift() as T;
          yield next;
          continue;
        }
        if (done) {
          if (error) throw error;
          return;
        }
        const next = await new Promise<IteratorResult<T>>((resolve, reject) => {
          pending = resolve;
          pendingReject = reject;
        });
        if (next.done) {
          if (error) throw error;
          return;
        }
        yield next.value;
      }
    } finally {
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }

  return { push, close, iterate };
}
