"""Generate synthetic reference branches using the official Anki 25.9.2 Rust backend.
Development-only: pip install --target .cache/anki-parity/python anki==25.9.2
No real collection, user account, SQL query, or application dependency is used.
"""
import json
import pathlib
import sys
import tempfile
import time
from importlib.metadata import version

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.cache/anki-parity/python'))
from anki.collection import Collection
from anki.cards import FSRSMemoryState
from google.protobuf.json_format import MessageToDict

assert version('anki') == '25.9.2'
cases = []
with tempfile.TemporaryDirectory(dir=ROOT / '.cache/anki-parity') as directory:
    col = Collection(str(pathlib.Path(directory) / 'synthetic.anki2'))
    try:
        col.set_config('fsrs', True)
        for retention in [.85, .9, .95]:
            cfg = col.decks.get_config(1)
            cfg['new']['delays'] = [1, 10]
            cfg['lapse']['delays'] = [10]
            cfg['desiredRetention'] = retention
            col.decks.update_config(cfg)
            for name, state, step, stability, difficulty, elapsed in [
                ('new', 0, 0, 0, 0, 0),
                ('learning-first', 1, 0, .212, 6.4133, 60),
                ('learning-last', 1, 1, 2.3065, 2.118104, 600),
                ('learning-less-than-a-day-across-UTC', 1, 1, 2.3065, 2.118104, 23*3600),
                ('learning-after-yesterday-failures', 1, 0, .1, 8, 86400),
                ('review-young', 2, 0, 8, 6, 7*86400),
                ('review-less-than-a-day-across-UTC', 2, 0, 8, 6, 23*3600),
                ('review-mature', 2, 0, 250, 5, 90*86400),
                ('relearning-same-day', 3, 0, 25, 7, 600),
                ('relearning-after-yesterday-failures', 3, 0, 25, 8, 86400),
            ]:
                now = int(time.time())
                note = col.new_note(col.models.current())
                note['Front'] = 'これ'
                note['Back'] = 'Synthetic reference only'
                col.add_note(note, 1)
                card = note.cards()[0]
                card.type = state
                card.queue = 2 if state == 2 else (1 if state else 0)
                if state:
                    card.memory_state = FSRSMemoryState(stability=stability, difficulty=difficulty)
                    card.last_review_time = now-elapsed
                    card.ivl = 90 if state == 2 else 0
                    card.reps = 50 if state in [2,3] else 3
                    card.lapses = 3 if state in [2,3] else 0
                    card.left = (2-step) if state == 1 else (1 if state == 3 else 0)
                    card.due = col.sched.today if state == 2 else now
                    col.update_card(card)
                states = MessageToDict(col._backend.get_scheduling_states(card.id))
                branches = {}
                for rating in ['again', 'good']:
                    normal = states[rating]['normal']
                    kind = next(iter(normal))
                    value = normal[kind]
                    learning = value.get('learning', value)
                    memory = learning.get('memoryState', value.get('memoryState'))
                    branches[rating] = {
                        'state': {'learning':1,'review':2,'relearning':3}[kind],
                        'step': (2 if kind == 'learning' else 1)-learning.get('remainingSteps',0) if kind != 'review' else 0,
                        'seconds': learning.get('scheduledSecs'),
                        'days': value.get('scheduledDays'),
                        'stability': memory['stability'], 'difficulty': memory['difficulty'],
                    }
                cases.append({'name':name,'retention':retention,'now':now*1000,
                    'before':{'state':state,'learningSteps':step,'stability':stability,'difficulty':difficulty,
                        'lastReview':(now-elapsed)*1000 if state else None,'reps':card.reps,'lapses':card.lapses,
                        'scheduledDays':card.ivl,'elapsedDays':0,'due':now*1000},
                    'branches':branches,'raw':states})
    finally:
        col.close()
output=ROOT/'src/app/core/services/fixtures/anki-25.9.2-reference.json'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'source':'anki 25.9.2 official Rust backend','fsrs':6,
    'learningSteps':[1,10],'relearningSteps':[10],'cases':cases},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(cases)} independent reference cases: {output}')
