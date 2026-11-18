import { signal } from '@angular/core';
import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import type { PuyiBlock, PuyiIsland, PuyiLibrarySource, PuyiPhrase, PuyiText } from './puyi-library-source';

const text = (es: string, en: string, ca: string): PuyiText => ({ es, en, ca });

function sample(id: string): PuyiPhrase {
  const phrase = PHRASE_ISLANDS_CATALOG.find(entry => entry.id === id);
  if (!phrase) throw new Error('Missing generic Puyi demo sample: ' + id);
  return {
    id: phrase.id,
    japanese: phrase.japanese,
    segments: phrase.segments,
    translation: text(phrase.localizations.es.natural, phrase.localizations.en.natural, phrase.localizations.ca.natural),
    audioUrl: phrase.audio.path,
  };
}

function block(id: string, name: PuyiText, clips: string[], questions: string[] = []): PuyiBlock {
  return { id, name, phrases: clips.map(sample), questions: questions.map(sample) };
}

const islands: readonly PuyiIsland[] = [
  {
    id: 'everyday', japanese: '日々の暮らし', title: text('Vida cotidiana', 'Everyday life', 'Vida quotidiana'),
    description: text('Habla de tus rutinas y tus planes.', 'Talk about your routines and plans.', 'Parla de les teves rutines i els teus plans.'),
    blocks: [
      block('at-home', text('En casa', 'At home', 'A casa'),
        ['pi-everyday-001', 'pi-everyday-002', 'pi-everyday-003', 'pi-everyday-004', 'pi-everyday-006'], ['pi-everyday-005']),
      block('free-time', text('Tiempo libre', 'Free time', 'Temps lliure'),
        ['pi-hobbies-002', 'pi-hobbies-003', 'pi-hobbies-004'], ['pi-hobbies-001']),
    ],
  },
  {
    id: 'travel', japanese: '旅のひとこと', title: text('De viaje', 'On the road', 'De viatge'),
    description: text('Oriéntate y cuenta dónde has estado.', 'Find your way and talk about where you’ve been.', 'Orienta’t i explica on has estat.'),
    blocks: [
      block('getting-around', text('Moverse por la ciudad', 'Getting around', 'Moure’s per la ciutat'),
        ['pi-travel-001', 'pi-travel-003', 'pi-travel-004'], ['pi-travel-002']),
      block('memories', text('Recuerdos del viaje', 'Travel memories', 'Records del viatge'),
        ['pi-travel-005', 'pi-travel-006']),
    ],
  },
  {
    id: 'conversation', japanese: '会話のきっかけ', title: text('Conversación', 'Conversation', 'Conversa'),
    description: text('Saluda, pide ayuda y sigue la conversación.', 'Say hello, ask for help and keep talking.', 'Saluda, demana ajuda i continua la conversa.'),
    blocks: [
      block('introductions', text('Primer encuentro', 'First meeting', 'Primera trobada'),
        ['pi-conversation-001', 'pi-conversation-004', 'pi-conversation-006']),
      block('clarification', text('Entenderse', 'Understanding each other', 'Entendre’s'),
        ['pi-conversation-002', 'pi-conversation-003'], ['pi-conversation-005']),
    ],
  },
];

export const puyiDemoSource: PuyiLibrarySource = {
  islands: signal(islands).asReadonly(),
  accessRevision: signal(0).asReadonly(),
};
