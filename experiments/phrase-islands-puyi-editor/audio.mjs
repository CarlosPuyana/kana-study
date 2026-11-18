import { DraftStore } from './store.mjs';

try {
  const [command, job, hash] = process.argv.slice(2);
  if (!job || (command !== 'register' && command !== 'approve') || (command === 'approve' && !/^[0-9a-f]{64}$/.test(hash ?? ''))) {
    throw new Error();
  }
  const { revision } = new DraftStore().registerAudio(job, command === 'approve' ? hash : undefined);
  console.log('Revisión privada guardada: ' + revision);
} catch {
  console.error('El trabajo local, la aprobación o los archivos no coinciden con la revisión actual.');
  process.exitCode = 1;
}
