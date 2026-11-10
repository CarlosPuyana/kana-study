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
            prefs=col.get_preferences();prefs.scheduling.learn_ahead_secs=1200;col.set_preferences(prefs)
            for name,state,step,stability,difficulty,elapsed in [
                ('ahead-learning-first-19m',1,0,.212,6.4133,120),
                ('outside-learning-21m',1,0,.212,6.4133,120),
                ('ahead-learning-last-8m',1,1,2.3065,2.118104,120),
                ('ahead-relearning-19m',3,0,25,7,120),
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
                    card.due = col.sched.today if state == 2 else now+(1260 if name.startswith('outside') else 480 if step else 1140)
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
                        'scheduledDays':card.ivl,'elapsedDays':0,'due':int(card.due)*1000},
                    'branches':branches,'raw':states,'queue':MessageToDict(col.sched.get_queued_cards(fetch_limit=10))})
                col.remove_notes([note.id])
    finally:
        col.close()
output=ROOT/'src/app/core/services/fixtures/anki-25.9.2-learn-ahead.json'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'source':'anki 25.9.2 official Rust backend','fsrs':6,
    'learningSteps':[1,10],'relearningSteps':[10],'cases':cases},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(cases)} independent reference cases: {output}')
