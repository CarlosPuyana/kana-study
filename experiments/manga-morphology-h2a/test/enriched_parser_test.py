"""Relationship/schema fixtures authored for tests, not real JMdict entries or gold labels."""
import importlib.util
import pathlib
import unittest
import xml.etree.ElementTree as ET

path = pathlib.Path(__file__).resolve().parents[1] / 'build-enriched.py'
spec = importlib.util.spec_from_file_location('adapter', path)
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


class EnrichedParserTest(unittest.TestCase):
    def test_constraints_languages_and_pos_inheritance_are_preserved(self):
        element = ET.fromstring('''<entry><ent_seq>1</ent_seq>
        <k_ele><keb>甲</keb><ke_inf>iK</ke_inf></k_ele><k_ele><keb>乙</keb></k_ele>
        <r_ele><reb>こう</reb><re_restr>甲</re_restr></r_ele>
        <r_ele><reb>おつ</reb><re_nokanji/></r_ele>
        <sense><stagk>甲</stagk><stagr>こう</stagr><pos>n</pos><gloss>test</gloss></sense>
        <sense><gloss xml:lang="spa">prueba</gloss></sense></entry>''')
        entry = adapter.convert_entry(element, 'test-only-source')
        self.assertEqual(entry['readings'][0]['restrictedTo'], ['甲'])
        self.assertTrue(entry['readings'][1]['noKanji'])
        self.assertEqual(entry['senses'][0]['allowedSpellings'], ['甲'])
        self.assertEqual(entry['senses'][0]['allowedReadings'], ['こう'])
        self.assertEqual(entry['senses'][1]['partsOfSpeech'], [])
        self.assertEqual(entry['senses'][1]['effectivePOS'], ['n'])
        self.assertEqual([s['glosses'][0]['language'] for s in entry['senses']], ['eng', 'spa'])
        self.assertFalse(entry['senses'][0]['referenceStableAcrossRevisions'])

    def test_entity_codes_are_preserved_without_reverse_guessing_descriptions(self):
        xml = b'''<?xml version="1.0"?><!DOCTYPE JMdict [<!ENTITY n "noun">]>
        <JMdict><entry><ent_seq>1</ent_seq><r_ele><reb>x</reb></r_ele>
        <sense><pos>&n;</pos><gloss>own test</gloss></sense></entry></JMdict>'''
        entry = next(adapter.parse_xml(xml))
        self.assertEqual(entry['senses'][0]['effectivePOS'], ['n'])

    def test_external_entities_are_rejected(self):
        xml = b'<!DOCTYPE JMdict [<!ENTITY secret SYSTEM "file:///private">]><JMdict/>'
        with self.assertRaisesRegex(ValueError, 'External entities'):
            list(adapter.parse_xml(xml))


if __name__ == '__main__':
    unittest.main()
