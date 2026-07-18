import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';

const outputDirectory = new URL('../public/assets/audio/', import.meta.url);
const sampleRate = 22_050;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeWave(new URL('laneway-ambience.wav', outputDirectory), ambience(6)),
  writeWave(new URL('confirm.wav', outputDirectory), confirmCue()),
  writeWave(new URL('event.wav', outputDirectory), eventCue()),
]);

function ambience(seconds: number): Float64Array {
  const length = sampleRate * seconds;
  const samples = new Float64Array(length);
  let randomState = 0x6c616e65;
  let brownNoise = 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    const whiteNoise = randomState / 0xffff_ffff - 0.5;
    brownNoise = Math.max(-0.6, Math.min(0.6, brownNoise * 0.985 + whiteNoise * 0.045));
    const roomTone = Math.sin(time * Math.PI * 2 * 74) * 0.012;
    const chatter = Math.sin(time * Math.PI * 2 * 181 + Math.sin(time * 2.3)) * 0.006;
    const clinks =
      decayingTone(time, 1.15, 1_240, 0.055, 0.12) +
      decayingTone(time, 3.05, 1_520, 0.04, 0.09) +
      decayingTone(time, 4.72, 980, 0.05, 0.14);
    const edgeFade = Math.min(1, time / 0.18, (seconds - time) / 0.18);
    samples[index] = (brownNoise * 0.06 + roomTone + chatter + clinks) * edgeFade;
  }
  return samples;
}

function confirmCue(): Float64Array {
  return toneSequence(0.22, (time) => {
    const envelope = Math.exp(-time * 13);
    return (
      (Math.sin(time * Math.PI * 2 * 520) * 0.16 + Math.sin(time * Math.PI * 2 * 780) * 0.08) *
      envelope
    );
  });
}

function eventCue(): Float64Array {
  return toneSequence(0.42, (time) => {
    const frequency = time < 0.18 ? 392 : 587;
    const localTime = time < 0.18 ? time : time - 0.18;
    return Math.sin(localTime * Math.PI * 2 * frequency) * 0.14 * Math.exp(-localTime * 7);
  });
}

function toneSequence(seconds: number, sample: (time: number) => number): Float64Array {
  return Float64Array.from({ length: Math.floor(sampleRate * seconds) }, (_, index) =>
    sample(index / sampleRate),
  );
}

function decayingTone(
  time: number,
  start: number,
  frequency: number,
  amplitude: number,
  decaySeconds: number,
): number {
  const elapsed = time - start;
  if (elapsed < 0 || elapsed > decaySeconds * 5) return 0;
  return (
    Math.sin(elapsed * Math.PI * 2 * frequency) * amplitude * Math.exp(-elapsed / decaySeconds)
  );
}

async function writeWave(url: URL, samples: Float64Array): Promise<void> {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 0x7fff), 44 + index * bytesPerSample);
  });
  await writeFile(url, buffer);
}
