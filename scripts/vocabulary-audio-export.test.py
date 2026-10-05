"""Approval policy tests; no model loading or audio generation."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audio_export', Path(__file__).with_name('export-vocabulary-audio.py'))
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.entries = [{'id': 'n5-test', 'primaryReading': 'あした'}]
        self.report = {'rows': [{'id': 'n5-test', 'ttsInput': 'あした', 'flags': ['review']} ]}

    def test_pending_review_is_excluded(self):
        self.assertEqual(exporter.select_rows(self.entries, self.report, []), [])

    def test_explicit_approval_reintroduces_reviewed_audio(self):
        self.assertEqual(len(exporter.select_rows(self.entries, self.report, ['n5-test'])), 1)

    def test_approval_never_overrides_ambiguous_reading(self):
        self.entries[0]['primaryReading'] = 'きゅう / く'
        self.report['rows'][0]['ttsInput'] = 'きゅう / く'
        with self.assertRaises(ValueError):
            exporter.select_rows(self.entries, self.report, ['n5-test'])

    def test_unknown_approval_and_wrong_tts_input_are_rejected(self):
        with self.assertRaises(ValueError):
            exporter.select_rows(self.entries, self.report, ['n5-missing'])
        self.report['rows'][0]['ttsInput'] = '明日'
        with self.assertRaises(ValueError):
            exporter.select_rows(self.entries, self.report, ['n5-test'])


if __name__ == '__main__':
    unittest.main()
