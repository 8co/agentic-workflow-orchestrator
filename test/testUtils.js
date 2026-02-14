import { Readable } from 'stream';

export function captureStdout(fn: () => void): string {
  const originalStdoutWrite = process.stdout.write;
  let output = '';
  (process.stdout.write as unknown) = (chunk: string | Buffer, encoding?: BufferEncoding, callback?: (err?: Error) => void): boolean => {
    output += chunk.toString();
    return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
  };

  fn();

  process.stdout.write = originalStdoutWrite as (chunk: Uint8Array | string, encoding?: BufferEncoding, callback?: (err?: Error) => void) => boolean;
  return output;
}

export function captureStderr(fn: () => void): string {
  const originalStderrWrite = process.stderr.write;
  let output = '';
  (process.stderr.write as unknown) = (chunk: string | Buffer, encoding?: BufferEncoding, callback?: (err?: Error) => void): boolean => {
    output += chunk.toString();
    return originalStderrWrite.call(process.stderr, chunk, encoding, callback);
  };

  fn();

  process.stderr.write = originalStderrWrite as (chunk: Uint8Array | string, encoding?: BufferEncoding, callback?: (err?: Error) => void) => boolean;
  return output;
}
