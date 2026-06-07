import type { BotLevel } from './types';

const WORKER_URL = '/stockfish/stockfish-18-lite-single.js';

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;
let activeReject: ((reason?: unknown) => void) | null = null;

function disposeWorker(reason = 'Stockfish request cancelled.') {
  activeReject?.(new Error(reason));
  activeReject = null;
  worker?.terminate();
  worker = null;
  readyPromise = null;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(WORKER_URL);
    worker.addEventListener('error', () => disposeWorker('Stockfish worker failed to load.'));
  }
  return worker;
}

function waitForReady(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    const engine = getWorker();
    let sawUciOk = false;
    const timeout = window.setTimeout(() => {
      cleanup();
      disposeWorker('Stockfish took too long to load.');
      reject(new Error('Stockfish took too long to load.'));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      engine.removeEventListener('message', onMessage);
      engine.removeEventListener('error', onError);
    };

    const onError = () => {
      cleanup();
      disposeWorker('Stockfish worker failed to load.');
      reject(new Error('Stockfish worker failed to load.'));
    };

    const onMessage = (event: MessageEvent<string>) => {
      const message = String(event.data);
      if (message === 'uciok') {
        sawUciOk = true;
        engine.postMessage('isready');
      } else if (sawUciOk && message === 'readyok') {
        cleanup();
        resolve();
      }
    };

    engine.addEventListener('message', onMessage);
    engine.addEventListener('error', onError);
    engine.postMessage('uci');
  });

  return readyPromise;
}

export async function getStockfishMove(fen: string, level: BotLevel): Promise<string> {
  cancelStockfishMove();
  await waitForReady();

  return new Promise((resolve, reject) => {
    const engine = getWorker();
    activeReject = reject;
    const timeout = window.setTimeout(() => {
      cleanup();
      disposeWorker('Stockfish took too long to move.');
      reject(new Error('Stockfish took too long to move.'));
    }, 20000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      activeReject = null;
      engine.removeEventListener('message', onMessage);
    };

    const onMessage = (event: MessageEvent<string>) => {
      const message = String(event.data);
      if (!message.startsWith('bestmove ')) return;

      const move = message.split(/\s+/)[1];
      cleanup();
      if (!move || move === '(none)') reject(new Error('Stockfish did not return a legal move.'));
      else resolve(move);
    };

    engine.addEventListener('message', onMessage);
    engine.postMessage('ucinewgame');
    engine.postMessage(`setoption name Skill Level value ${level.stockfishSkill}`);
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go movetime ${level.moveTimeMs}`);
  });
}

export function cancelStockfishMove() {
  if (!activeReject) return;
  disposeWorker();
}
