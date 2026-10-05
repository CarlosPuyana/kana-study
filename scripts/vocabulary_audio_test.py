import importlib.util
from pathlib import Path
import unittest
import numpy as np

from kokoro_audio import eligibility_reason, vocabulary, audio_metrics, g2p_flags, POC_WORDS

spec = importlib.util.spec_from_file_location('generator', Path(__file__).with_name('generate-vocabulary-audio.py'))
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class VocabularyAudioTests(unittest.TestCase):
    def test_accepts_single_hiragana_katakana_and_long_vowels(self):
        for reading in ['たべる', 'おかあさん', 'コーヒー', 'がっこう', 'ぎゅうにゅう']:
            self.assertIsNone(eligibility_reason(reading))

    def test_excludes_alternatives_without_selecting_first(self):
        for reading in ['きゅう / く', 'なん/なに', 'し／よん', 'いい、よい', 'じゅう とお', 'いい|よい']:
            self.assertIsNotNone(eligibility_reason(reading))

    def test_excludes_unexpected_signs_and_empty_readings(self):
        for reading in ['', None, 'abc', '食べる', 'たべる。', 'きゅう（く）', '９', 'ひと\n']:
            self.assertIsNotNone(eligibility_reason(reading))

    def test_dataset_is_662_unique_stable_ids(self):
        entries = vocabulary()
        self.assertEqual(len(entries), 662)
        self.assertEqual(len({entry['id'] for entry in entries}), 662)

    def test_dataset_has_648_eligible_and_14_exclusions(self):
        entries = vocabulary()
        self.assertEqual(sum(eligibility_reason(e['primaryReading']) is None for e in entries), 648)
        excluded = [generator.exclusion(e) for e in entries if generator.exclusion(e)]
        self.assertEqual(len(excluded), 14)
        self.assertEqual(next(e for e in excluded if e['word'] == '九')['primaryReading'], 'きゅう / く')
        self.assertTrue(all(set(e) == {'id', 'word', 'primaryReading', 'reason'} for e in excluded))

    def test_metrics_accepts_audible_signal_with_positive_duration(self):
        audio = 0.3 * np.sin(np.arange(24000) * 0.08)
        metrics = audio_metrics(audio)
        self.assertEqual(metrics['seconds'], 1)
        self.assertEqual(metrics['clippedSamples'], 0)

    def test_metrics_rejects_silence_empty_nan_and_wrong_rate(self):
        for audio in [np.zeros(100), np.array([]), np.array([float('nan')]), np.full(100, 0.000001)]:
            with self.assertRaises(ValueError):
                audio_metrics(audio)
        with self.assertRaises(ValueError):
            audio_metrics(np.full(100, 0.1), 48000)

    def test_metrics_rejects_clipping(self):
        for audio in [np.full(100, 1.1), np.r_[np.zeros(100), [0.999, 0.999, 0.999], np.zeros(100)]]:
            with self.assertRaises(ValueError):
                audio_metrics(audio)

    def test_g2p_flags_boundaries_long_readings_and_unknown_symbols(self):
        vocab = set('abc ')
        self.assertIn('G2P boundary: review internal pause', g2p_flags('がくせい', 'a b', vocab))
        self.assertIn('Anomalous/unsupported G2P symbols', g2p_flags('あ', '❓', vocab))
        self.assertTrue(g2p_flags('あ' * 10, 'abc', vocab))
        self.assertEqual(g2p_flags('あ', 'abc', vocab), [])

    def test_manifest_accepts_exact_coverage_and_relative_id_filenames(self):
        generator.validate_manifest([{'id': 'n5-a'}], {'n5-a': 'n5-a.mp3'}, ['n5-a.mp3'])

    def test_manifest_rejects_unknown_ids_missing_or_orphan_audio(self):
        cases = [({'n5-z': 'n5-z.mp3'}, ['n5-z.mp3']),
                 ({'n5-a': 'n5-a.mp3'}, []),
                 ({'n5-a': 'n5-a.mp3'}, ['n5-a.mp3', 'orphan.mp3'])]
        for manifest, files in cases:
            with self.assertRaises(ValueError):
                generator.validate_manifest([{'id': 'n5-a'}], manifest, files)

    def test_manifest_rejects_shared_assets_and_unsafe_names(self):
        for manifest in [{'n5-a': '../a.mp3'}, {'n5-a': 'n5-a.mp3', 'n5-b': 'n5-a.mp3'}]:
            with self.assertRaises(ValueError):
                generator.validate_manifest([{'id': 'n5-a'}, {'id': 'n5-b'}], manifest, list(manifest.values()))

    def test_qa_includes_40_poc_entries_required_cases_and_20_additions(self):
        entries = vocabulary()
        rows = [{'id': e['id']} for e in entries if not eligibility_reason(e['primaryReading'])]
        sample = generator.qa_selection(entries, rows)
        self.assertEqual(len(sample), 60)
        self.assertEqual(len({e['id'] for e in sample}), 60)
        self.assertTrue(set(POC_WORDS) <= {e['primaryWrittenForm'] for e in sample})

    def test_qa_never_renders_excluded_nine_as_valid_audio(self):
        entry = next(e for e in vocabulary() if e['primaryWrittenForm'] == '九')
        output = generator.qa_html([entry], [], [generator.exclusion(entry)], [])
        self.assertIn('Excluded', output)
        self.assertNotIn('<audio', output)
        self.assertIn(entry['id'], output)


if __name__ == '__main__':
    unittest.main()
