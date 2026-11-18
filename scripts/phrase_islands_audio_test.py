"""Audio boundary tests; fixture waves are signals for encoder QA, never TTS samples."""
import array, math, pathlib, shutil, tempfile, unittest, wave
from unittest.mock import patch
from urllib.error import URLError
from phrase_islands_audio import wav_metrics, encode_mp3, synthesize, sha
ROOT=pathlib.Path(__file__).resolve().parents[1]
class AudioTests(unittest.TestCase):
 def setUp(self):
  base=ROOT/'.phrase-islands-authoring/tests/audio';base.mkdir(parents=True,exist_ok=True);self.dir=pathlib.Path(tempfile.mkdtemp(dir=base));self.wav=self.dir/'fixture.wav'
 def make_wave(self,samples=None):
  samples=samples or [int(8000*math.sin(n*2*math.pi*440/44100)) for n in range(22050)]
  with wave.open(str(self.wav),'wb') as w:w.setparams((1,2,44100,len(samples),'NONE','not compressed'));w.writeframes(array.array('h',samples).tobytes())
 def test_valid_reference(self):
  self.make_wave();m=wav_metrics(self.wav);self.assertEqual(m['sampleRate'],44100);self.assertAlmostEqual(m['durationSeconds'],.5)
 def test_silent_and_clipped_are_rejected(self):
  self.make_wave([0]*22050)
  with self.assertRaises(ValueError):wav_metrics(self.wav)
  self.make_wave([32767]*22050)
  with self.assertRaises(ValueError):wav_metrics(self.wav)
 def test_missing_encoder_preserves_master(self):
  self.make_wave();before=sha(self.wav)
  with self.assertRaises(FileNotFoundError):encode_mp3(self.wav,self.dir/'missing.mp3','nonexistent-authoring-ffmpeg')
  self.assertEqual(sha(self.wav),before);self.assertFalse((self.dir/'missing.mp3').exists())
 def test_engine_connection_failure_never_returns_fake_audio(self):
  with patch('urllib.request.urlopen',side_effect=URLError('engine unavailable')):
   with self.assertRaises(URLError):synthesize('http://127.0.0.1:1','休みます。',1310138976)
 @unittest.skipUnless(shutil.which('ffmpeg'),'FFmpeg unavailable: decoder integration requires local authoring dependencies')
 def test_real_encoder_round_trip_and_immutable_existing_file(self):
  self.make_wave();out=self.dir/'test.mp3';m=encode_mp3(self.wav,out);before=sha(out);again=encode_mp3(self.wav,out);self.assertEqual(sha(out),before);self.assertLess(m['decodedPeak'],1);self.assertGreater(again['comparisonSnrDb'],10)
if __name__=='__main__':unittest.main()
