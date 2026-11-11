import {ConjugationVerb} from '../core/models/conjugation-practice.model';

// Shared editorial catalog for present and future verb categories.
// Literal answers only: no runtime conjugation or transliteration.
export const CONJUGATION_VERBS:readonly ConjugationVerb[] = [
  {
    "id": "iku",
    "type": "godan",
    "japanese": "行く",
    "kana": "いく",
    "meaningKey": "conjugations.verb.iku",
    "conjugations": {
      "negative": {
        "romaji": [
          "ikanai"
        ],
        "kana": [
          "いかない"
        ],
        "kanji": [
          "行かない"
        ]
      },
      "past": {
        "romaji": [
          "itta"
        ],
        "kana": [
          "いった"
        ],
        "kanji": [
          "行った"
        ]
      },
      "negativePast": {
        "romaji": [
          "ikanakatta"
        ],
        "kana": [
          "いかなかった"
        ],
        "kanji": [
          "行かなかった"
        ]
      },
      "te": {
        "romaji": [
          "itte"
        ],
        "kana": [
          "いって"
        ],
        "kanji": [
          "行って"
        ]
      },
      "desire": {
        "kana": [
          "いきたい"
        ],
        "kanji": [
          "行きたい"
        ],
        "romaji": [
          "ikitai"
        ]
      },
      "polite": {
        "kana": [
          "いきます"
        ],
        "kanji": [
          "行きます"
        ],
        "romaji": [
          "ikimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "itteiru"
        ],
        "kana": [
          "いっている"
        ],
        "kanji": [
          "行っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "ittara"
        ],
        "kana": [
          "いったら"
        ],
        "kanji": [
          "行ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "ikeba"
        ],
        "kana": [
          "いけば"
        ],
        "kanji": [
          "行けば"
        ]
      },
      "volitional": {
        "romaji": [
          "ikou"
        ],
        "kana": [
          "いこう"
        ],
        "kanji": [
          "行こう"
        ]
      },
      "potential": {
        "romaji": [
          "ikeru"
        ],
        "kana": [
          "いける"
        ],
        "kanji": [
          "行ける"
        ]
      },
      "passive": {
        "romaji": [
          "ikareru"
        ],
        "kana": [
          "いかれる"
        ],
        "kanji": [
          "行かれる"
        ]
      },
      "causative": {
        "romaji": [
          "ikaseru"
        ],
        "kana": [
          "いかせる"
        ],
        "kanji": [
          "行かせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "ikaserareru",
          "ikasareru"
        ],
        "kana": [
          "いかせられる",
          "いかされる"
        ],
        "kanji": [
          "行かせられる",
          "行かされる"
        ]
      },
      "imperative": {
        "romaji": [
          "ike"
        ],
        "kana": [
          "いけ"
        ],
        "kanji": [
          "行け"
        ]
      },
      "prohibitive": {
        "romaji": [
          "ikuna"
        ],
        "kana": [
          "いくな"
        ],
        "kanji": [
          "行くな"
        ]
      }
    }
  },
  {
    "id": "kaeru",
    "type": "godan",
    "japanese": "帰る",
    "kana": "かえる",
    "meaningKey": "conjugations.verb.kaeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "kaeranai"
        ],
        "kana": [
          "かえらない"
        ],
        "kanji": [
          "帰らない"
        ]
      },
      "past": {
        "romaji": [
          "kaetta"
        ],
        "kana": [
          "かえった"
        ],
        "kanji": [
          "帰った"
        ]
      },
      "negativePast": {
        "romaji": [
          "kaeranakatta"
        ],
        "kana": [
          "かえらなかった"
        ],
        "kanji": [
          "帰らなかった"
        ]
      },
      "te": {
        "romaji": [
          "kaette"
        ],
        "kana": [
          "かえって"
        ],
        "kanji": [
          "帰って"
        ]
      },
      "desire": {
        "kana": [
          "かえりたい"
        ],
        "kanji": [
          "帰りたい"
        ],
        "romaji": [
          "kaeritai"
        ]
      },
      "polite": {
        "kana": [
          "かえります"
        ],
        "kanji": [
          "帰ります"
        ],
        "romaji": [
          "kaerimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "kaetteiru"
        ],
        "kana": [
          "かえっている"
        ],
        "kanji": [
          "帰っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kaettara"
        ],
        "kana": [
          "かえったら"
        ],
        "kanji": [
          "帰ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kaereba"
        ],
        "kana": [
          "かえれば"
        ],
        "kanji": [
          "帰れば"
        ]
      },
      "volitional": {
        "romaji": [
          "kaerou"
        ],
        "kana": [
          "かえろう"
        ],
        "kanji": [
          "帰ろう"
        ]
      },
      "potential": {
        "romaji": [
          "kaereru"
        ],
        "kana": [
          "かえれる"
        ],
        "kanji": [
          "帰れる"
        ]
      },
      "passive": {
        "romaji": [
          "kaerareru"
        ],
        "kana": [
          "かえられる"
        ],
        "kanji": [
          "帰られる"
        ]
      },
      "causative": {
        "romaji": [
          "kaeraseru"
        ],
        "kana": [
          "かえらせる"
        ],
        "kanji": [
          "帰らせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kaeraserareru",
          "kaerasareru"
        ],
        "kana": [
          "かえらせられる",
          "かえらされる"
        ],
        "kanji": [
          "帰らせられる",
          "帰らされる"
        ]
      },
      "imperative": {
        "romaji": [
          "kaere"
        ],
        "kana": [
          "かえれ"
        ],
        "kanji": [
          "帰れ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kaeruna"
        ],
        "kana": [
          "かえるな"
        ],
        "kanji": [
          "帰るな"
        ]
      }
    }
  },
  {
    "id": "aru",
    "type": "godan",
    "japanese": "ある",
    "kana": "ある",
    "meaningKey": "conjugations.verb.aru",
    "conjugations": {
      "negative": {
        "romaji": [
          "nai"
        ],
        "kana": [
          "ない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "atta"
        ],
        "kana": [
          "あった"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "nakatta"
        ],
        "kana": [
          "なかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "atte"
        ],
        "kana": [
          "あって"
        ],
        "kanji": []
      },
      "polite": {
        "kana": [
          "あります"
        ],
        "kanji": [],
        "romaji": [
          "arimasu"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "attara"
        ],
        "kana": [
          "あったら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "areba"
        ],
        "kana": [
          "あれば"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "iu",
    "type": "godan",
    "japanese": "言う",
    "kana": "いう",
    "meaningKey": "conjugations.verb.iu",
    "conjugations": {
      "negative": {
        "romaji": [
          "iwanai"
        ],
        "kana": [
          "いわない"
        ],
        "kanji": [
          "言わない"
        ]
      },
      "past": {
        "romaji": [
          "itta"
        ],
        "kana": [
          "いった"
        ],
        "kanji": [
          "言った"
        ]
      },
      "negativePast": {
        "romaji": [
          "iwanakatta"
        ],
        "kana": [
          "いわなかった"
        ],
        "kanji": [
          "言わなかった"
        ]
      },
      "te": {
        "romaji": [
          "itte"
        ],
        "kana": [
          "いって"
        ],
        "kanji": [
          "言って"
        ]
      },
      "desire": {
        "kana": [
          "いいたい"
        ],
        "kanji": [
          "言いたい"
        ],
        "romaji": [
          "iitai"
        ]
      },
      "polite": {
        "kana": [
          "いいます"
        ],
        "kanji": [
          "言います"
        ],
        "romaji": [
          "iimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "itteiru"
        ],
        "kana": [
          "いっている"
        ],
        "kanji": [
          "言っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "ittara"
        ],
        "kana": [
          "いったら"
        ],
        "kanji": [
          "言ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "ieba"
        ],
        "kana": [
          "いえば"
        ],
        "kanji": [
          "言えば"
        ]
      },
      "volitional": {
        "romaji": [
          "iou"
        ],
        "kana": [
          "いおう"
        ],
        "kanji": [
          "言おう"
        ]
      },
      "potential": {
        "romaji": [
          "ieru"
        ],
        "kana": [
          "いえる"
        ],
        "kanji": [
          "言える"
        ]
      },
      "passive": {
        "romaji": [
          "iwareru"
        ],
        "kana": [
          "いわれる"
        ],
        "kanji": [
          "言われる"
        ]
      },
      "causative": {
        "romaji": [
          "iwaseru"
        ],
        "kana": [
          "いわせる"
        ],
        "kanji": [
          "言わせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "iwaserareru",
          "iwasareru"
        ],
        "kana": [
          "いわせられる",
          "いわされる"
        ],
        "kanji": [
          "言わせられる",
          "言わされる"
        ]
      },
      "imperative": {
        "romaji": [
          "ie"
        ],
        "kana": [
          "いえ"
        ],
        "kanji": [
          "言え"
        ]
      },
      "prohibitive": {
        "romaji": [
          "iuna"
        ],
        "kana": [
          "いうな"
        ],
        "kanji": [
          "言うな"
        ]
      }
    }
  },
  {
    "id": "omou",
    "type": "godan",
    "japanese": "思う",
    "kana": "おもう",
    "meaningKey": "conjugations.verb.omou",
    "conjugations": {
      "negative": {
        "romaji": [
          "omowanai"
        ],
        "kana": [
          "おもわない"
        ],
        "kanji": [
          "思わない"
        ]
      },
      "past": {
        "romaji": [
          "omotta"
        ],
        "kana": [
          "おもった"
        ],
        "kanji": [
          "思った"
        ]
      },
      "negativePast": {
        "romaji": [
          "omowanakatta"
        ],
        "kana": [
          "おもわなかった"
        ],
        "kanji": [
          "思わなかった"
        ]
      },
      "te": {
        "romaji": [
          "omotte"
        ],
        "kana": [
          "おもって"
        ],
        "kanji": [
          "思って"
        ]
      },
      "desire": {
        "kana": [
          "おもいたい"
        ],
        "kanji": [
          "思いたい"
        ],
        "romaji": [
          "omoitai"
        ]
      },
      "polite": {
        "kana": [
          "おもいます"
        ],
        "kanji": [
          "思います"
        ],
        "romaji": [
          "omoimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "omotteiru"
        ],
        "kana": [
          "おもっている"
        ],
        "kanji": [
          "思っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "omottara"
        ],
        "kana": [
          "おもったら"
        ],
        "kanji": [
          "思ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "omoeba"
        ],
        "kana": [
          "おもえば"
        ],
        "kanji": [
          "思えば"
        ]
      },
      "volitional": {
        "romaji": [
          "omoou"
        ],
        "kana": [
          "おもおう"
        ],
        "kanji": [
          "思おう"
        ]
      },
      "potential": {
        "romaji": [
          "omoeru"
        ],
        "kana": [
          "おもえる"
        ],
        "kanji": [
          "思える"
        ]
      },
      "passive": {
        "romaji": [
          "omowareru"
        ],
        "kana": [
          "おもわれる"
        ],
        "kanji": [
          "思われる"
        ]
      },
      "causative": {
        "romaji": [
          "omowaseru"
        ],
        "kana": [
          "おもわせる"
        ],
        "kanji": [
          "思わせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "omowaserareru",
          "omowasareru"
        ],
        "kana": [
          "おもわせられる",
          "おもわされる"
        ],
        "kanji": [
          "思わせられる",
          "思わされる"
        ]
      },
      "imperative": {
        "romaji": [
          "omoe"
        ],
        "kana": [
          "おもえ"
        ],
        "kanji": [
          "思え"
        ]
      },
      "prohibitive": {
        "romaji": [
          "omouna"
        ],
        "kana": [
          "おもうな"
        ],
        "kanji": [
          "思うな"
        ]
      }
    }
  },
  {
    "id": "kau",
    "type": "godan",
    "japanese": "買う",
    "kana": "かう",
    "meaningKey": "conjugations.verb.kau",
    "conjugations": {
      "negative": {
        "romaji": [
          "kawanai"
        ],
        "kana": [
          "かわない"
        ],
        "kanji": [
          "買わない"
        ]
      },
      "past": {
        "romaji": [
          "katta"
        ],
        "kana": [
          "かった"
        ],
        "kanji": [
          "買った"
        ]
      },
      "negativePast": {
        "romaji": [
          "kawanakatta"
        ],
        "kana": [
          "かわなかった"
        ],
        "kanji": [
          "買わなかった"
        ]
      },
      "te": {
        "romaji": [
          "katte"
        ],
        "kana": [
          "かって"
        ],
        "kanji": [
          "買って"
        ]
      },
      "desire": {
        "kana": [
          "かいたい"
        ],
        "kanji": [
          "買いたい"
        ],
        "romaji": [
          "kaitai"
        ]
      },
      "polite": {
        "kana": [
          "かいます"
        ],
        "kanji": [
          "買います"
        ],
        "romaji": [
          "kaimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "katteiru"
        ],
        "kana": [
          "かっている"
        ],
        "kanji": [
          "買っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kattara"
        ],
        "kana": [
          "かったら"
        ],
        "kanji": [
          "買ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kaeba"
        ],
        "kana": [
          "かえば"
        ],
        "kanji": [
          "買えば"
        ]
      },
      "volitional": {
        "romaji": [
          "kaou"
        ],
        "kana": [
          "かおう"
        ],
        "kanji": [
          "買おう"
        ]
      },
      "potential": {
        "romaji": [
          "kaeru"
        ],
        "kana": [
          "かえる"
        ],
        "kanji": [
          "買える"
        ]
      },
      "passive": {
        "romaji": [
          "kawareru"
        ],
        "kana": [
          "かわれる"
        ],
        "kanji": [
          "買われる"
        ]
      },
      "causative": {
        "romaji": [
          "kawaseru"
        ],
        "kana": [
          "かわせる"
        ],
        "kanji": [
          "買わせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kawaserareru",
          "kawasareru"
        ],
        "kana": [
          "かわせられる",
          "かわされる"
        ],
        "kanji": [
          "買わせられる",
          "買わされる"
        ]
      },
      "imperative": {
        "romaji": [
          "kae"
        ],
        "kana": [
          "かえ"
        ],
        "kanji": [
          "買え"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kauna"
        ],
        "kana": [
          "かうな"
        ],
        "kanji": [
          "買うな"
        ]
      }
    }
  },
  {
    "id": "tsukau",
    "type": "godan",
    "japanese": "使う",
    "kana": "つかう",
    "meaningKey": "conjugations.verb.tsukau",
    "conjugations": {
      "negative": {
        "romaji": [
          "tsukawanai"
        ],
        "kana": [
          "つかわない"
        ],
        "kanji": [
          "使わない"
        ]
      },
      "past": {
        "romaji": [
          "tsukatta"
        ],
        "kana": [
          "つかった"
        ],
        "kanji": [
          "使った"
        ]
      },
      "negativePast": {
        "romaji": [
          "tsukawanakatta"
        ],
        "kana": [
          "つかわなかった"
        ],
        "kanji": [
          "使わなかった"
        ]
      },
      "te": {
        "romaji": [
          "tsukatte"
        ],
        "kana": [
          "つかって"
        ],
        "kanji": [
          "使って"
        ]
      },
      "desire": {
        "kana": [
          "つかいたい"
        ],
        "kanji": [
          "使いたい"
        ],
        "romaji": [
          "tsukaitai"
        ]
      },
      "polite": {
        "kana": [
          "つかいます"
        ],
        "kanji": [
          "使います"
        ],
        "romaji": [
          "tsukaimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "tsukatteiru"
        ],
        "kana": [
          "つかっている"
        ],
        "kanji": [
          "使っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "tsukattara"
        ],
        "kana": [
          "つかったら"
        ],
        "kanji": [
          "使ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "tsukaeba"
        ],
        "kana": [
          "つかえば"
        ],
        "kanji": [
          "使えば"
        ]
      },
      "volitional": {
        "romaji": [
          "tsukaou"
        ],
        "kana": [
          "つかおう"
        ],
        "kanji": [
          "使おう"
        ]
      },
      "potential": {
        "romaji": [
          "tsukaeru"
        ],
        "kana": [
          "つかえる"
        ],
        "kanji": [
          "使える"
        ]
      },
      "passive": {
        "romaji": [
          "tsukawareru"
        ],
        "kana": [
          "つかわれる"
        ],
        "kanji": [
          "使われる"
        ]
      },
      "causative": {
        "romaji": [
          "tsukawaseru"
        ],
        "kana": [
          "つかわせる"
        ],
        "kanji": [
          "使わせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "tsukawaserareru",
          "tsukawasareru"
        ],
        "kana": [
          "つかわせられる",
          "つかわされる"
        ],
        "kanji": [
          "使わせられる",
          "使わされる"
        ]
      },
      "imperative": {
        "romaji": [
          "tsukae"
        ],
        "kana": [
          "つかえ"
        ],
        "kanji": [
          "使え"
        ]
      },
      "prohibitive": {
        "romaji": [
          "tsukauna"
        ],
        "kana": [
          "つかうな"
        ],
        "kanji": [
          "使うな"
        ]
      }
    }
  },
  {
    "id": "au",
    "type": "godan",
    "japanese": "会う",
    "kana": "あう",
    "meaningKey": "conjugations.verb.au",
    "conjugations": {
      "negative": {
        "romaji": [
          "awanai"
        ],
        "kana": [
          "あわない"
        ],
        "kanji": [
          "会わない"
        ]
      },
      "past": {
        "romaji": [
          "atta"
        ],
        "kana": [
          "あった"
        ],
        "kanji": [
          "会った"
        ]
      },
      "negativePast": {
        "romaji": [
          "awanakatta"
        ],
        "kana": [
          "あわなかった"
        ],
        "kanji": [
          "会わなかった"
        ]
      },
      "te": {
        "romaji": [
          "atte"
        ],
        "kana": [
          "あって"
        ],
        "kanji": [
          "会って"
        ]
      },
      "desire": {
        "kana": [
          "あいたい"
        ],
        "kanji": [
          "会いたい"
        ],
        "romaji": [
          "aitai"
        ]
      },
      "polite": {
        "kana": [
          "あいます"
        ],
        "kanji": [
          "会います"
        ],
        "romaji": [
          "aimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "atteiru"
        ],
        "kana": [
          "あっている"
        ],
        "kanji": [
          "会っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "attara"
        ],
        "kana": [
          "あったら"
        ],
        "kanji": [
          "会ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "aeba"
        ],
        "kana": [
          "あえば"
        ],
        "kanji": [
          "会えば"
        ]
      },
      "volitional": {
        "romaji": [
          "aou"
        ],
        "kana": [
          "あおう"
        ],
        "kanji": [
          "会おう"
        ]
      },
      "potential": {
        "romaji": [
          "aeru"
        ],
        "kana": [
          "あえる"
        ],
        "kanji": [
          "会える"
        ]
      },
      "passive": {
        "romaji": [
          "awareru"
        ],
        "kana": [
          "あわれる"
        ],
        "kanji": [
          "会われる"
        ]
      },
      "causative": {
        "romaji": [
          "awaseru"
        ],
        "kana": [
          "あわせる"
        ],
        "kanji": [
          "会わせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "awaserareru",
          "awasareru"
        ],
        "kana": [
          "あわせられる",
          "あわされる"
        ],
        "kanji": [
          "会わせられる",
          "会わされる"
        ]
      },
      "imperative": {
        "romaji": [
          "ae"
        ],
        "kana": [
          "あえ"
        ],
        "kanji": [
          "会え"
        ]
      },
      "prohibitive": {
        "romaji": [
          "auna"
        ],
        "kana": [
          "あうな"
        ],
        "kanji": [
          "会うな"
        ]
      }
    }
  },
  {
    "id": "matsu",
    "type": "godan",
    "japanese": "待つ",
    "kana": "まつ",
    "meaningKey": "conjugations.verb.matsu",
    "conjugations": {
      "negative": {
        "romaji": [
          "matanai"
        ],
        "kana": [
          "またない"
        ],
        "kanji": [
          "待たない"
        ]
      },
      "past": {
        "romaji": [
          "matta"
        ],
        "kana": [
          "まった"
        ],
        "kanji": [
          "待った"
        ]
      },
      "negativePast": {
        "romaji": [
          "matanakatta"
        ],
        "kana": [
          "またなかった"
        ],
        "kanji": [
          "待たなかった"
        ]
      },
      "te": {
        "romaji": [
          "matte"
        ],
        "kana": [
          "まって"
        ],
        "kanji": [
          "待って"
        ]
      },
      "desire": {
        "kana": [
          "まちたい"
        ],
        "kanji": [
          "待ちたい"
        ],
        "romaji": [
          "machitai"
        ]
      },
      "polite": {
        "kana": [
          "まちます"
        ],
        "kanji": [
          "待ちます"
        ],
        "romaji": [
          "machimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "matteiru"
        ],
        "kana": [
          "まっている"
        ],
        "kanji": [
          "待っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "mattara"
        ],
        "kana": [
          "まったら"
        ],
        "kanji": [
          "待ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "mateba"
        ],
        "kana": [
          "まてば"
        ],
        "kanji": [
          "待てば"
        ]
      },
      "volitional": {
        "romaji": [
          "matou"
        ],
        "kana": [
          "まとう"
        ],
        "kanji": [
          "待とう"
        ]
      },
      "potential": {
        "romaji": [
          "materu"
        ],
        "kana": [
          "まてる"
        ],
        "kanji": [
          "待てる"
        ]
      },
      "passive": {
        "romaji": [
          "matareru"
        ],
        "kana": [
          "またれる"
        ],
        "kanji": [
          "待たれる"
        ]
      },
      "causative": {
        "romaji": [
          "mataseru"
        ],
        "kana": [
          "またせる"
        ],
        "kanji": [
          "待たせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "mataserareru",
          "matasareru"
        ],
        "kana": [
          "またせられる",
          "またされる"
        ],
        "kanji": [
          "待たせられる",
          "待たされる"
        ]
      },
      "imperative": {
        "romaji": [
          "mate"
        ],
        "kana": [
          "まて"
        ],
        "kanji": [
          "待て"
        ]
      },
      "prohibitive": {
        "romaji": [
          "matsuna"
        ],
        "kana": [
          "まつな"
        ],
        "kanji": [
          "待つな"
        ]
      }
    }
  },
  {
    "id": "motsu",
    "type": "godan",
    "japanese": "持つ",
    "kana": "もつ",
    "meaningKey": "conjugations.verb.motsu",
    "conjugations": {
      "negative": {
        "romaji": [
          "motanai"
        ],
        "kana": [
          "もたない"
        ],
        "kanji": [
          "持たない"
        ]
      },
      "past": {
        "romaji": [
          "motta"
        ],
        "kana": [
          "もった"
        ],
        "kanji": [
          "持った"
        ]
      },
      "negativePast": {
        "romaji": [
          "motanakatta"
        ],
        "kana": [
          "もたなかった"
        ],
        "kanji": [
          "持たなかった"
        ]
      },
      "te": {
        "romaji": [
          "motte"
        ],
        "kana": [
          "もって"
        ],
        "kanji": [
          "持って"
        ]
      },
      "desire": {
        "kana": [
          "もちたい"
        ],
        "kanji": [
          "持ちたい"
        ],
        "romaji": [
          "mochitai"
        ]
      },
      "polite": {
        "kana": [
          "もちます"
        ],
        "kanji": [
          "持ちます"
        ],
        "romaji": [
          "mochimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "motteiru"
        ],
        "kana": [
          "もっている"
        ],
        "kanji": [
          "持っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "mottara"
        ],
        "kana": [
          "もったら"
        ],
        "kanji": [
          "持ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "moteba"
        ],
        "kana": [
          "もてば"
        ],
        "kanji": [
          "持てば"
        ]
      },
      "volitional": {
        "romaji": [
          "motou"
        ],
        "kana": [
          "もとう"
        ],
        "kanji": [
          "持とう"
        ]
      },
      "potential": {
        "romaji": [
          "moteru"
        ],
        "kana": [
          "もてる"
        ],
        "kanji": [
          "持てる"
        ]
      },
      "passive": {
        "romaji": [
          "motareru"
        ],
        "kana": [
          "もたれる"
        ],
        "kanji": [
          "持たれる"
        ]
      },
      "causative": {
        "romaji": [
          "motaseru"
        ],
        "kana": [
          "もたせる"
        ],
        "kanji": [
          "持たせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "motaserareru",
          "motasareru"
        ],
        "kana": [
          "もたせられる",
          "もたされる"
        ],
        "kanji": [
          "持たせられる",
          "持たされる"
        ]
      },
      "imperative": {
        "romaji": [
          "mote"
        ],
        "kana": [
          "もて"
        ],
        "kanji": [
          "持て"
        ]
      },
      "prohibitive": {
        "romaji": [
          "motsuna"
        ],
        "kana": [
          "もつな"
        ],
        "kanji": [
          "持つな"
        ]
      }
    }
  },
  {
    "id": "toru",
    "type": "godan",
    "japanese": "取る",
    "kana": "とる",
    "meaningKey": "conjugations.verb.toru",
    "conjugations": {
      "negative": {
        "romaji": [
          "toranai"
        ],
        "kana": [
          "とらない"
        ],
        "kanji": [
          "取らない"
        ]
      },
      "past": {
        "romaji": [
          "totta"
        ],
        "kana": [
          "とった"
        ],
        "kanji": [
          "取った"
        ]
      },
      "negativePast": {
        "romaji": [
          "toranakatta"
        ],
        "kana": [
          "とらなかった"
        ],
        "kanji": [
          "取らなかった"
        ]
      },
      "te": {
        "romaji": [
          "totte"
        ],
        "kana": [
          "とって"
        ],
        "kanji": [
          "取って"
        ]
      },
      "desire": {
        "kana": [
          "とりたい"
        ],
        "kanji": [
          "取りたい"
        ],
        "romaji": [
          "toritai"
        ]
      },
      "polite": {
        "kana": [
          "とります"
        ],
        "kanji": [
          "取ります"
        ],
        "romaji": [
          "torimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "totteiru"
        ],
        "kana": [
          "とっている"
        ],
        "kanji": [
          "取っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "tottara"
        ],
        "kana": [
          "とったら"
        ],
        "kanji": [
          "取ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "toreba"
        ],
        "kana": [
          "とれば"
        ],
        "kanji": [
          "取れば"
        ]
      },
      "volitional": {
        "romaji": [
          "torou"
        ],
        "kana": [
          "とろう"
        ],
        "kanji": [
          "取ろう"
        ]
      },
      "potential": {
        "romaji": [
          "toreru"
        ],
        "kana": [
          "とれる"
        ],
        "kanji": [
          "取れる"
        ]
      },
      "passive": {
        "romaji": [
          "torareru"
        ],
        "kana": [
          "とられる"
        ],
        "kanji": [
          "取られる"
        ]
      },
      "causative": {
        "romaji": [
          "toraseru"
        ],
        "kana": [
          "とらせる"
        ],
        "kanji": [
          "取らせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "toraserareru",
          "torasareru"
        ],
        "kana": [
          "とらせられる",
          "とらされる"
        ],
        "kanji": [
          "取らせられる",
          "取らされる"
        ]
      },
      "imperative": {
        "romaji": [
          "tore"
        ],
        "kana": [
          "とれ"
        ],
        "kanji": [
          "取れ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "toruna"
        ],
        "kana": [
          "とるな"
        ],
        "kanji": [
          "取るな"
        ]
      }
    }
  },
  {
    "id": "wakaru",
    "type": "godan",
    "japanese": "分かる",
    "kana": "わかる",
    "meaningKey": "conjugations.verb.wakaru",
    "conjugations": {
      "negative": {
        "romaji": [
          "wakaranai"
        ],
        "kana": [
          "わからない"
        ],
        "kanji": [
          "分からない"
        ]
      },
      "past": {
        "romaji": [
          "wakatta"
        ],
        "kana": [
          "わかった"
        ],
        "kanji": [
          "分かった"
        ]
      },
      "negativePast": {
        "romaji": [
          "wakaranakatta"
        ],
        "kana": [
          "わからなかった"
        ],
        "kanji": [
          "分からなかった"
        ]
      },
      "te": {
        "romaji": [
          "wakatte"
        ],
        "kana": [
          "わかって"
        ],
        "kanji": [
          "分かって"
        ]
      },
      "desire": {
        "kana": [
          "わかりたい"
        ],
        "kanji": [
          "分かりたい"
        ],
        "romaji": [
          "wakaritai"
        ]
      },
      "polite": {
        "kana": [
          "わかります"
        ],
        "kanji": [
          "分かります"
        ],
        "romaji": [
          "wakarimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "wakatteiru"
        ],
        "kana": [
          "わかっている"
        ],
        "kanji": [
          "分かっている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "wakattara"
        ],
        "kana": [
          "わかったら"
        ],
        "kanji": [
          "分かったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "wakareba"
        ],
        "kana": [
          "わかれば"
        ],
        "kanji": [
          "分かれば"
        ]
      },
      "volitional": {
        "romaji": [
          "wakarou"
        ],
        "kana": [
          "わかろう"
        ],
        "kanji": [
          "分かろう"
        ]
      },
      "causative": {
        "romaji": [
          "wakaraseru"
        ],
        "kana": [
          "わからせる"
        ],
        "kanji": [
          "分からせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "wakaraserareru",
          "wakarasareru"
        ],
        "kana": [
          "わからせられる",
          "わからされる"
        ],
        "kanji": [
          "分からせられる",
          "分からされる"
        ]
      }
    }
  },
  {
    "id": "naru",
    "type": "godan",
    "japanese": "なる",
    "kana": "なる",
    "meaningKey": "conjugations.verb.naru",
    "conjugations": {
      "negative": {
        "romaji": [
          "naranai"
        ],
        "kana": [
          "ならない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "natta"
        ],
        "kana": [
          "なった"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "naranakatta"
        ],
        "kana": [
          "ならなかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "natte"
        ],
        "kana": [
          "なって"
        ],
        "kanji": []
      },
      "desire": {
        "kana": [
          "なりたい"
        ],
        "kanji": [],
        "romaji": [
          "naritai"
        ]
      },
      "polite": {
        "kana": [
          "なります"
        ],
        "kanji": [],
        "romaji": [
          "narimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "natteiru"
        ],
        "kana": [
          "なっている"
        ],
        "kanji": []
      },
      "conditionalTara": {
        "romaji": [
          "nattara"
        ],
        "kana": [
          "なったら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "nareba"
        ],
        "kana": [
          "なれば"
        ],
        "kanji": []
      },
      "volitional": {
        "romaji": [
          "narou"
        ],
        "kana": [
          "なろう"
        ],
        "kanji": []
      },
      "potential": {
        "romaji": [
          "nareru"
        ],
        "kana": [
          "なれる"
        ],
        "kanji": []
      },
      "causative": {
        "romaji": [
          "naraseru"
        ],
        "kana": [
          "ならせる"
        ],
        "kanji": []
      },
      "causativePassive": {
        "romaji": [
          "naraserareru",
          "narasareru"
        ],
        "kana": [
          "ならせられる",
          "ならされる"
        ],
        "kanji": []
      },
      "imperative": {
        "romaji": [
          "nare"
        ],
        "kana": [
          "なれ"
        ],
        "kanji": []
      },
      "prohibitive": {
        "romaji": [
          "naruna"
        ],
        "kana": [
          "なるな"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "hairu",
    "type": "godan",
    "japanese": "入る",
    "kana": "はいる",
    "meaningKey": "conjugations.verb.hairu",
    "conjugations": {
      "negative": {
        "romaji": [
          "hairanai"
        ],
        "kana": [
          "はいらない"
        ],
        "kanji": [
          "入らない"
        ]
      },
      "past": {
        "romaji": [
          "haitta"
        ],
        "kana": [
          "はいった"
        ],
        "kanji": [
          "入った"
        ]
      },
      "negativePast": {
        "romaji": [
          "hairanakatta"
        ],
        "kana": [
          "はいらなかった"
        ],
        "kanji": [
          "入らなかった"
        ]
      },
      "te": {
        "romaji": [
          "haitte"
        ],
        "kana": [
          "はいって"
        ],
        "kanji": [
          "入って"
        ]
      },
      "desire": {
        "kana": [
          "はいりたい"
        ],
        "kanji": [
          "入りたい"
        ],
        "romaji": [
          "hairitai"
        ]
      },
      "polite": {
        "kana": [
          "はいります"
        ],
        "kanji": [
          "入ります"
        ],
        "romaji": [
          "hairimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "haitteiru"
        ],
        "kana": [
          "はいっている"
        ],
        "kanji": [
          "入っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "haittara"
        ],
        "kana": [
          "はいったら"
        ],
        "kanji": [
          "入ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "haireba"
        ],
        "kana": [
          "はいれば"
        ],
        "kanji": [
          "入れば"
        ]
      },
      "volitional": {
        "romaji": [
          "hairou"
        ],
        "kana": [
          "はいろう"
        ],
        "kanji": [
          "入ろう"
        ]
      },
      "potential": {
        "romaji": [
          "haireru"
        ],
        "kana": [
          "はいれる"
        ],
        "kanji": [
          "入れる"
        ]
      },
      "passive": {
        "romaji": [
          "hairareru"
        ],
        "kana": [
          "はいられる"
        ],
        "kanji": [
          "入られる"
        ]
      },
      "causative": {
        "romaji": [
          "hairaseru"
        ],
        "kana": [
          "はいらせる"
        ],
        "kanji": [
          "入らせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "hairaserareru",
          "hairasareru"
        ],
        "kana": [
          "はいらせられる",
          "はいらされる"
        ],
        "kanji": [
          "入らせられる",
          "入らされる"
        ]
      },
      "imperative": {
        "romaji": [
          "haire"
        ],
        "kana": [
          "はいれ"
        ],
        "kanji": [
          "入れ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "hairuna"
        ],
        "kana": [
          "はいるな"
        ],
        "kanji": [
          "入るな"
        ]
      }
    }
  },
  {
    "id": "suwaru",
    "type": "godan",
    "japanese": "座る",
    "kana": "すわる",
    "meaningKey": "conjugations.verb.suwaru",
    "conjugations": {
      "negative": {
        "romaji": [
          "suwaranai"
        ],
        "kana": [
          "すわらない"
        ],
        "kanji": [
          "座らない"
        ]
      },
      "past": {
        "romaji": [
          "suwatta"
        ],
        "kana": [
          "すわった"
        ],
        "kanji": [
          "座った"
        ]
      },
      "negativePast": {
        "romaji": [
          "suwaranakatta"
        ],
        "kana": [
          "すわらなかった"
        ],
        "kanji": [
          "座らなかった"
        ]
      },
      "te": {
        "romaji": [
          "suwatte"
        ],
        "kana": [
          "すわって"
        ],
        "kanji": [
          "座って"
        ]
      },
      "desire": {
        "kana": [
          "すわりたい"
        ],
        "kanji": [
          "座りたい"
        ],
        "romaji": [
          "suwaritai"
        ]
      },
      "polite": {
        "kana": [
          "すわります"
        ],
        "kanji": [
          "座ります"
        ],
        "romaji": [
          "suwarimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "suwatteiru"
        ],
        "kana": [
          "すわっている"
        ],
        "kanji": [
          "座っている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "suwattara"
        ],
        "kana": [
          "すわったら"
        ],
        "kanji": [
          "座ったら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "suwareba"
        ],
        "kana": [
          "すわれば"
        ],
        "kanji": [
          "座れば"
        ]
      },
      "volitional": {
        "romaji": [
          "suwarou"
        ],
        "kana": [
          "すわろう"
        ],
        "kanji": [
          "座ろう"
        ]
      },
      "potential": {
        "romaji": [
          "suwareru"
        ],
        "kana": [
          "すわれる"
        ],
        "kanji": [
          "座れる"
        ]
      },
      "passive": {
        "romaji": [
          "suwarareru"
        ],
        "kana": [
          "すわられる"
        ],
        "kanji": [
          "座られる"
        ]
      },
      "causative": {
        "romaji": [
          "suwaraseru"
        ],
        "kana": [
          "すわらせる"
        ],
        "kanji": [
          "座らせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "suwaraserareru",
          "suwarasareru"
        ],
        "kana": [
          "すわらせられる",
          "すわらされる"
        ],
        "kanji": [
          "座らせられる",
          "座らされる"
        ]
      },
      "imperative": {
        "romaji": [
          "suware"
        ],
        "kana": [
          "すわれ"
        ],
        "kanji": [
          "座れ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "suwaruna"
        ],
        "kana": [
          "すわるな"
        ],
        "kanji": [
          "座るな"
        ]
      }
    }
  },
  {
    "id": "nomu",
    "type": "godan",
    "japanese": "飲む",
    "kana": "のむ",
    "meaningKey": "conjugations.verb.nomu",
    "conjugations": {
      "negative": {
        "romaji": [
          "nomanai"
        ],
        "kana": [
          "のまない"
        ],
        "kanji": [
          "飲まない"
        ]
      },
      "past": {
        "romaji": [
          "nonda"
        ],
        "kana": [
          "のんだ"
        ],
        "kanji": [
          "飲んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "nomanakatta"
        ],
        "kana": [
          "のまなかった"
        ],
        "kanji": [
          "飲まなかった"
        ]
      },
      "te": {
        "romaji": [
          "nonde"
        ],
        "kana": [
          "のんで"
        ],
        "kanji": [
          "飲んで"
        ]
      },
      "desire": {
        "kana": [
          "のみたい"
        ],
        "kanji": [
          "飲みたい"
        ],
        "romaji": [
          "nomitai"
        ]
      },
      "polite": {
        "kana": [
          "のみます"
        ],
        "kanji": [
          "飲みます"
        ],
        "romaji": [
          "nomimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "nondeiru"
        ],
        "kana": [
          "のんでいる"
        ],
        "kanji": [
          "飲んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "nondara"
        ],
        "kana": [
          "のんだら"
        ],
        "kanji": [
          "飲んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "nomeba"
        ],
        "kana": [
          "のめば"
        ],
        "kanji": [
          "飲めば"
        ]
      },
      "volitional": {
        "romaji": [
          "nomou"
        ],
        "kana": [
          "のもう"
        ],
        "kanji": [
          "飲もう"
        ]
      },
      "potential": {
        "romaji": [
          "nomeru"
        ],
        "kana": [
          "のめる"
        ],
        "kanji": [
          "飲める"
        ]
      },
      "passive": {
        "romaji": [
          "nomareru"
        ],
        "kana": [
          "のまれる"
        ],
        "kanji": [
          "飲まれる"
        ]
      },
      "causative": {
        "romaji": [
          "nomaseru"
        ],
        "kana": [
          "のませる"
        ],
        "kanji": [
          "飲ませる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "nomaserareru",
          "nomasareru"
        ],
        "kana": [
          "のませられる",
          "のまされる"
        ],
        "kanji": [
          "飲ませられる",
          "飲まされる"
        ]
      },
      "imperative": {
        "romaji": [
          "nome"
        ],
        "kana": [
          "のめ"
        ],
        "kanji": [
          "飲め"
        ]
      },
      "prohibitive": {
        "romaji": [
          "nomuna"
        ],
        "kana": [
          "のむな"
        ],
        "kanji": [
          "飲むな"
        ]
      }
    }
  },
  {
    "id": "yomu",
    "type": "godan",
    "japanese": "読む",
    "kana": "よむ",
    "meaningKey": "conjugations.verb.yomu",
    "conjugations": {
      "negative": {
        "romaji": [
          "yomanai"
        ],
        "kana": [
          "よまない"
        ],
        "kanji": [
          "読まない"
        ]
      },
      "past": {
        "romaji": [
          "yonda"
        ],
        "kana": [
          "よんだ"
        ],
        "kanji": [
          "読んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "yomanakatta"
        ],
        "kana": [
          "よまなかった"
        ],
        "kanji": [
          "読まなかった"
        ]
      },
      "te": {
        "romaji": [
          "yonde"
        ],
        "kana": [
          "よんで"
        ],
        "kanji": [
          "読んで"
        ]
      },
      "desire": {
        "kana": [
          "よみたい"
        ],
        "kanji": [
          "読みたい"
        ],
        "romaji": [
          "yomitai"
        ]
      },
      "polite": {
        "kana": [
          "よみます"
        ],
        "kanji": [
          "読みます"
        ],
        "romaji": [
          "yomimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "yondeiru"
        ],
        "kana": [
          "よんでいる"
        ],
        "kanji": [
          "読んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "yondara"
        ],
        "kana": [
          "よんだら"
        ],
        "kanji": [
          "読んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "yomeba"
        ],
        "kana": [
          "よめば"
        ],
        "kanji": [
          "読めば"
        ]
      },
      "volitional": {
        "romaji": [
          "yomou"
        ],
        "kana": [
          "よもう"
        ],
        "kanji": [
          "読もう"
        ]
      },
      "potential": {
        "romaji": [
          "yomeru"
        ],
        "kana": [
          "よめる"
        ],
        "kanji": [
          "読める"
        ]
      },
      "passive": {
        "romaji": [
          "yomareru"
        ],
        "kana": [
          "よまれる"
        ],
        "kanji": [
          "読まれる"
        ]
      },
      "causative": {
        "romaji": [
          "yomaseru"
        ],
        "kana": [
          "よませる"
        ],
        "kanji": [
          "読ませる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "yomaserareru",
          "yomasareru"
        ],
        "kana": [
          "よませられる",
          "よまされる"
        ],
        "kanji": [
          "読ませられる",
          "読まされる"
        ]
      },
      "imperative": {
        "romaji": [
          "yome"
        ],
        "kana": [
          "よめ"
        ],
        "kanji": [
          "読め"
        ]
      },
      "prohibitive": {
        "romaji": [
          "yomuna"
        ],
        "kana": [
          "よむな"
        ],
        "kanji": [
          "読むな"
        ]
      }
    }
  },
  {
    "id": "yasumu",
    "type": "godan",
    "japanese": "休む",
    "kana": "やすむ",
    "meaningKey": "conjugations.verb.yasumu",
    "conjugations": {
      "negative": {
        "romaji": [
          "yasumanai"
        ],
        "kana": [
          "やすまない"
        ],
        "kanji": [
          "休まない"
        ]
      },
      "past": {
        "romaji": [
          "yasunda"
        ],
        "kana": [
          "やすんだ"
        ],
        "kanji": [
          "休んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "yasumanakatta"
        ],
        "kana": [
          "やすまなかった"
        ],
        "kanji": [
          "休まなかった"
        ]
      },
      "te": {
        "romaji": [
          "yasunde"
        ],
        "kana": [
          "やすんで"
        ],
        "kanji": [
          "休んで"
        ]
      },
      "desire": {
        "kana": [
          "やすみたい"
        ],
        "kanji": [
          "休みたい"
        ],
        "romaji": [
          "yasumitai"
        ]
      },
      "polite": {
        "kana": [
          "やすみます"
        ],
        "kanji": [
          "休みます"
        ],
        "romaji": [
          "yasumimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "yasundeiru"
        ],
        "kana": [
          "やすんでいる"
        ],
        "kanji": [
          "休んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "yasundara"
        ],
        "kana": [
          "やすんだら"
        ],
        "kanji": [
          "休んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "yasumeba"
        ],
        "kana": [
          "やすめば"
        ],
        "kanji": [
          "休めば"
        ]
      },
      "volitional": {
        "romaji": [
          "yasumou"
        ],
        "kana": [
          "やすもう"
        ],
        "kanji": [
          "休もう"
        ]
      },
      "potential": {
        "romaji": [
          "yasumeru"
        ],
        "kana": [
          "やすめる"
        ],
        "kanji": [
          "休める"
        ]
      },
      "passive": {
        "romaji": [
          "yasumareru"
        ],
        "kana": [
          "やすまれる"
        ],
        "kanji": [
          "休まれる"
        ]
      },
      "causative": {
        "romaji": [
          "yasumaseru"
        ],
        "kana": [
          "やすませる"
        ],
        "kanji": [
          "休ませる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "yasumaserareru",
          "yasumasareru"
        ],
        "kana": [
          "やすませられる",
          "やすまされる"
        ],
        "kanji": [
          "休ませられる",
          "休まされる"
        ]
      },
      "imperative": {
        "romaji": [
          "yasume"
        ],
        "kana": [
          "やすめ"
        ],
        "kanji": [
          "休め"
        ]
      },
      "prohibitive": {
        "romaji": [
          "yasumuna"
        ],
        "kana": [
          "やすむな"
        ],
        "kanji": [
          "休むな"
        ]
      }
    }
  },
  {
    "id": "sumu",
    "type": "godan",
    "japanese": "住む",
    "kana": "すむ",
    "meaningKey": "conjugations.verb.sumu",
    "conjugations": {
      "negative": {
        "romaji": [
          "sumanai"
        ],
        "kana": [
          "すまない"
        ],
        "kanji": [
          "住まない"
        ]
      },
      "past": {
        "romaji": [
          "sunda"
        ],
        "kana": [
          "すんだ"
        ],
        "kanji": [
          "住んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "sumanakatta"
        ],
        "kana": [
          "すまなかった"
        ],
        "kanji": [
          "住まなかった"
        ]
      },
      "te": {
        "romaji": [
          "sunde"
        ],
        "kana": [
          "すんで"
        ],
        "kanji": [
          "住んで"
        ]
      },
      "desire": {
        "kana": [
          "すみたい"
        ],
        "kanji": [
          "住みたい"
        ],
        "romaji": [
          "sumitai"
        ]
      },
      "polite": {
        "kana": [
          "すみます"
        ],
        "kanji": [
          "住みます"
        ],
        "romaji": [
          "sumimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "sundeiru"
        ],
        "kana": [
          "すんでいる"
        ],
        "kanji": [
          "住んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "sundara"
        ],
        "kana": [
          "すんだら"
        ],
        "kanji": [
          "住んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "sumeba"
        ],
        "kana": [
          "すめば"
        ],
        "kanji": [
          "住めば"
        ]
      },
      "volitional": {
        "romaji": [
          "sumou"
        ],
        "kana": [
          "すもう"
        ],
        "kanji": [
          "住もう"
        ]
      },
      "potential": {
        "romaji": [
          "sumeru"
        ],
        "kana": [
          "すめる"
        ],
        "kanji": [
          "住める"
        ]
      },
      "passive": {
        "romaji": [
          "sumareru"
        ],
        "kana": [
          "すまれる"
        ],
        "kanji": [
          "住まれる"
        ]
      },
      "causative": {
        "romaji": [
          "sumaseru"
        ],
        "kana": [
          "すませる"
        ],
        "kanji": [
          "住ませる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "sumaserareru",
          "sumasareru"
        ],
        "kana": [
          "すませられる",
          "すまされる"
        ],
        "kanji": [
          "住ませられる",
          "住まされる"
        ]
      },
      "imperative": {
        "romaji": [
          "sume"
        ],
        "kana": [
          "すめ"
        ],
        "kanji": [
          "住め"
        ]
      },
      "prohibitive": {
        "romaji": [
          "sumuna"
        ],
        "kana": [
          "すむな"
        ],
        "kanji": [
          "住むな"
        ]
      }
    }
  },
  {
    "id": "shinu",
    "type": "godan",
    "japanese": "死ぬ",
    "kana": "しぬ",
    "meaningKey": "conjugations.verb.shinu",
    "conjugations": {
      "negative": {
        "romaji": [
          "shinanai"
        ],
        "kana": [
          "しなない"
        ],
        "kanji": [
          "死なない"
        ]
      },
      "past": {
        "romaji": [
          "shinda"
        ],
        "kana": [
          "しんだ"
        ],
        "kanji": [
          "死んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "shinanakatta"
        ],
        "kana": [
          "しななかった"
        ],
        "kanji": [
          "死ななかった"
        ]
      },
      "te": {
        "romaji": [
          "shinde"
        ],
        "kana": [
          "しんで"
        ],
        "kanji": [
          "死んで"
        ]
      },
      "desire": {
        "kana": [
          "しにたい"
        ],
        "kanji": [
          "死にたい"
        ],
        "romaji": [
          "shinitai"
        ]
      },
      "polite": {
        "kana": [
          "しにます"
        ],
        "kanji": [
          "死にます"
        ],
        "romaji": [
          "shinimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "shindeiru"
        ],
        "kana": [
          "しんでいる"
        ],
        "kanji": [
          "死んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "shindara"
        ],
        "kana": [
          "しんだら"
        ],
        "kanji": [
          "死んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "shineba"
        ],
        "kana": [
          "しねば"
        ],
        "kanji": [
          "死ねば"
        ]
      },
      "volitional": {
        "romaji": [
          "shinou"
        ],
        "kana": [
          "しのう"
        ],
        "kanji": [
          "死のう"
        ]
      },
      "potential": {
        "romaji": [
          "shineru"
        ],
        "kana": [
          "しねる"
        ],
        "kanji": [
          "死ねる"
        ]
      },
      "passive": {
        "romaji": [
          "shinareru"
        ],
        "kana": [
          "しなれる"
        ],
        "kanji": [
          "死なれる"
        ]
      },
      "causative": {
        "romaji": [
          "shinaseru"
        ],
        "kana": [
          "しなせる"
        ],
        "kanji": [
          "死なせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "shinaserareru",
          "shinasareru"
        ],
        "kana": [
          "しなせられる",
          "しなされる"
        ],
        "kanji": [
          "死なせられる",
          "死なされる"
        ]
      },
      "imperative": {
        "romaji": [
          "shine"
        ],
        "kana": [
          "しね"
        ],
        "kanji": [
          "死ね"
        ]
      },
      "prohibitive": {
        "romaji": [
          "shinuna"
        ],
        "kana": [
          "しぬな"
        ],
        "kanji": [
          "死ぬな"
        ]
      }
    }
  },
  {
    "id": "asobu",
    "type": "godan",
    "japanese": "遊ぶ",
    "kana": "あそぶ",
    "meaningKey": "conjugations.verb.asobu",
    "conjugations": {
      "negative": {
        "romaji": [
          "asobanai"
        ],
        "kana": [
          "あそばない"
        ],
        "kanji": [
          "遊ばない"
        ]
      },
      "past": {
        "romaji": [
          "asonda"
        ],
        "kana": [
          "あそんだ"
        ],
        "kanji": [
          "遊んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "asobanakatta"
        ],
        "kana": [
          "あそばなかった"
        ],
        "kanji": [
          "遊ばなかった"
        ]
      },
      "te": {
        "romaji": [
          "asonde"
        ],
        "kana": [
          "あそんで"
        ],
        "kanji": [
          "遊んで"
        ]
      },
      "desire": {
        "kana": [
          "あそびたい"
        ],
        "kanji": [
          "遊びたい"
        ],
        "romaji": [
          "asobitai"
        ]
      },
      "polite": {
        "kana": [
          "あそびます"
        ],
        "kanji": [
          "遊びます"
        ],
        "romaji": [
          "asobimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "asondeiru"
        ],
        "kana": [
          "あそんでいる"
        ],
        "kanji": [
          "遊んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "asondara"
        ],
        "kana": [
          "あそんだら"
        ],
        "kanji": [
          "遊んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "asobeba"
        ],
        "kana": [
          "あそべば"
        ],
        "kanji": [
          "遊べば"
        ]
      },
      "volitional": {
        "romaji": [
          "asobou"
        ],
        "kana": [
          "あそぼう"
        ],
        "kanji": [
          "遊ぼう"
        ]
      },
      "potential": {
        "romaji": [
          "asoberu"
        ],
        "kana": [
          "あそべる"
        ],
        "kanji": [
          "遊べる"
        ]
      },
      "passive": {
        "romaji": [
          "asobareru"
        ],
        "kana": [
          "あそばれる"
        ],
        "kanji": [
          "遊ばれる"
        ]
      },
      "causative": {
        "romaji": [
          "asobaseru"
        ],
        "kana": [
          "あそばせる"
        ],
        "kanji": [
          "遊ばせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "asobaserareru",
          "asobasareru"
        ],
        "kana": [
          "あそばせられる",
          "あそばされる"
        ],
        "kanji": [
          "遊ばせられる",
          "遊ばされる"
        ]
      },
      "imperative": {
        "romaji": [
          "asobe"
        ],
        "kana": [
          "あそべ"
        ],
        "kanji": [
          "遊べ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "asobuna"
        ],
        "kana": [
          "あそぶな"
        ],
        "kanji": [
          "遊ぶな"
        ]
      }
    }
  },
  {
    "id": "yobu",
    "type": "godan",
    "japanese": "呼ぶ",
    "kana": "よぶ",
    "meaningKey": "conjugations.verb.yobu",
    "conjugations": {
      "negative": {
        "romaji": [
          "yobanai"
        ],
        "kana": [
          "よばない"
        ],
        "kanji": [
          "呼ばない"
        ]
      },
      "past": {
        "romaji": [
          "yonda"
        ],
        "kana": [
          "よんだ"
        ],
        "kanji": [
          "呼んだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "yobanakatta"
        ],
        "kana": [
          "よばなかった"
        ],
        "kanji": [
          "呼ばなかった"
        ]
      },
      "te": {
        "romaji": [
          "yonde"
        ],
        "kana": [
          "よんで"
        ],
        "kanji": [
          "呼んで"
        ]
      },
      "desire": {
        "kana": [
          "よびたい"
        ],
        "kanji": [
          "呼びたい"
        ],
        "romaji": [
          "yobitai"
        ]
      },
      "polite": {
        "kana": [
          "よびます"
        ],
        "kanji": [
          "呼びます"
        ],
        "romaji": [
          "yobimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "yondeiru"
        ],
        "kana": [
          "よんでいる"
        ],
        "kanji": [
          "呼んでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "yondara"
        ],
        "kana": [
          "よんだら"
        ],
        "kanji": [
          "呼んだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "yobeba"
        ],
        "kana": [
          "よべば"
        ],
        "kanji": [
          "呼べば"
        ]
      },
      "volitional": {
        "romaji": [
          "yobou"
        ],
        "kana": [
          "よぼう"
        ],
        "kanji": [
          "呼ぼう"
        ]
      },
      "potential": {
        "romaji": [
          "yoberu"
        ],
        "kana": [
          "よべる"
        ],
        "kanji": [
          "呼べる"
        ]
      },
      "passive": {
        "romaji": [
          "yobareru"
        ],
        "kana": [
          "よばれる"
        ],
        "kanji": [
          "呼ばれる"
        ]
      },
      "causative": {
        "romaji": [
          "yobaseru"
        ],
        "kana": [
          "よばせる"
        ],
        "kanji": [
          "呼ばせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "yobaserareru",
          "yobasareru"
        ],
        "kana": [
          "よばせられる",
          "よばされる"
        ],
        "kanji": [
          "呼ばせられる",
          "呼ばされる"
        ]
      },
      "imperative": {
        "romaji": [
          "yobe"
        ],
        "kana": [
          "よべ"
        ],
        "kanji": [
          "呼べ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "yobuna"
        ],
        "kana": [
          "よぶな"
        ],
        "kanji": [
          "呼ぶな"
        ]
      }
    }
  },
  {
    "id": "kaku",
    "type": "godan",
    "japanese": "書く",
    "kana": "かく",
    "meaningKey": "conjugations.verb.kaku",
    "conjugations": {
      "negative": {
        "romaji": [
          "kakanai"
        ],
        "kana": [
          "かかない"
        ],
        "kanji": [
          "書かない"
        ]
      },
      "past": {
        "romaji": [
          "kaita"
        ],
        "kana": [
          "かいた"
        ],
        "kanji": [
          "書いた"
        ]
      },
      "negativePast": {
        "romaji": [
          "kakanakatta"
        ],
        "kana": [
          "かかなかった"
        ],
        "kanji": [
          "書かなかった"
        ]
      },
      "te": {
        "romaji": [
          "kaite"
        ],
        "kana": [
          "かいて"
        ],
        "kanji": [
          "書いて"
        ]
      },
      "desire": {
        "kana": [
          "かきたい"
        ],
        "kanji": [
          "書きたい"
        ],
        "romaji": [
          "kakitai"
        ]
      },
      "polite": {
        "kana": [
          "かきます"
        ],
        "kanji": [
          "書きます"
        ],
        "romaji": [
          "kakimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "kaiteiru"
        ],
        "kana": [
          "かいている"
        ],
        "kanji": [
          "書いている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kaitara"
        ],
        "kana": [
          "かいたら"
        ],
        "kanji": [
          "書いたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kakeba"
        ],
        "kana": [
          "かけば"
        ],
        "kanji": [
          "書けば"
        ]
      },
      "volitional": {
        "romaji": [
          "kakou"
        ],
        "kana": [
          "かこう"
        ],
        "kanji": [
          "書こう"
        ]
      },
      "potential": {
        "romaji": [
          "kakeru"
        ],
        "kana": [
          "かける"
        ],
        "kanji": [
          "書ける"
        ]
      },
      "passive": {
        "romaji": [
          "kakareru"
        ],
        "kana": [
          "かかれる"
        ],
        "kanji": [
          "書かれる"
        ]
      },
      "causative": {
        "romaji": [
          "kakaseru"
        ],
        "kana": [
          "かかせる"
        ],
        "kanji": [
          "書かせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kakaserareru",
          "kakasareru"
        ],
        "kana": [
          "かかせられる",
          "かかされる"
        ],
        "kanji": [
          "書かせられる",
          "書かされる"
        ]
      },
      "imperative": {
        "romaji": [
          "kake"
        ],
        "kana": [
          "かけ"
        ],
        "kanji": [
          "書け"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kakuna"
        ],
        "kana": [
          "かくな"
        ],
        "kanji": [
          "書くな"
        ]
      }
    }
  },
  {
    "id": "kiku",
    "type": "godan",
    "japanese": "聞く",
    "kana": "きく",
    "meaningKey": "conjugations.verb.kiku",
    "conjugations": {
      "negative": {
        "romaji": [
          "kikanai"
        ],
        "kana": [
          "きかない"
        ],
        "kanji": [
          "聞かない"
        ]
      },
      "past": {
        "romaji": [
          "kiita"
        ],
        "kana": [
          "きいた"
        ],
        "kanji": [
          "聞いた"
        ]
      },
      "negativePast": {
        "romaji": [
          "kikanakatta"
        ],
        "kana": [
          "きかなかった"
        ],
        "kanji": [
          "聞かなかった"
        ]
      },
      "te": {
        "romaji": [
          "kiite"
        ],
        "kana": [
          "きいて"
        ],
        "kanji": [
          "聞いて"
        ]
      },
      "desire": {
        "kana": [
          "ききたい"
        ],
        "kanji": [
          "聞きたい"
        ],
        "romaji": [
          "kikitai"
        ]
      },
      "polite": {
        "kana": [
          "ききます"
        ],
        "kanji": [
          "聞きます"
        ],
        "romaji": [
          "kikimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "kiiteiru"
        ],
        "kana": [
          "きいている"
        ],
        "kanji": [
          "聞いている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kiitara"
        ],
        "kana": [
          "きいたら"
        ],
        "kanji": [
          "聞いたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kikeba"
        ],
        "kana": [
          "きけば"
        ],
        "kanji": [
          "聞けば"
        ]
      },
      "volitional": {
        "romaji": [
          "kikou"
        ],
        "kana": [
          "きこう"
        ],
        "kanji": [
          "聞こう"
        ]
      },
      "potential": {
        "romaji": [
          "kikeru"
        ],
        "kana": [
          "きける"
        ],
        "kanji": [
          "聞ける"
        ]
      },
      "passive": {
        "romaji": [
          "kikareru"
        ],
        "kana": [
          "きかれる"
        ],
        "kanji": [
          "聞かれる"
        ]
      },
      "causative": {
        "romaji": [
          "kikaseru"
        ],
        "kana": [
          "きかせる"
        ],
        "kanji": [
          "聞かせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kikaserareru",
          "kikasareru"
        ],
        "kana": [
          "きかせられる",
          "きかされる"
        ],
        "kanji": [
          "聞かせられる",
          "聞かされる"
        ]
      },
      "imperative": {
        "romaji": [
          "kike"
        ],
        "kana": [
          "きけ"
        ],
        "kanji": [
          "聞け"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kikuna"
        ],
        "kana": [
          "きくな"
        ],
        "kanji": [
          "聞くな"
        ]
      }
    }
  },
  {
    "id": "hataraku",
    "type": "godan",
    "japanese": "働く",
    "kana": "はたらく",
    "meaningKey": "conjugations.verb.hataraku",
    "conjugations": {
      "negative": {
        "romaji": [
          "hatarakanai"
        ],
        "kana": [
          "はたらかない"
        ],
        "kanji": [
          "働かない"
        ]
      },
      "past": {
        "romaji": [
          "hataraita"
        ],
        "kana": [
          "はたらいた"
        ],
        "kanji": [
          "働いた"
        ]
      },
      "negativePast": {
        "romaji": [
          "hatarakanakatta"
        ],
        "kana": [
          "はたらかなかった"
        ],
        "kanji": [
          "働かなかった"
        ]
      },
      "te": {
        "romaji": [
          "hataraite"
        ],
        "kana": [
          "はたらいて"
        ],
        "kanji": [
          "働いて"
        ]
      },
      "desire": {
        "kana": [
          "はたらきたい"
        ],
        "kanji": [
          "働きたい"
        ],
        "romaji": [
          "hatarakitai"
        ]
      },
      "polite": {
        "kana": [
          "はたらきます"
        ],
        "kanji": [
          "働きます"
        ],
        "romaji": [
          "hatarakimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "hataraiteiru"
        ],
        "kana": [
          "はたらいている"
        ],
        "kanji": [
          "働いている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "hataraitara"
        ],
        "kana": [
          "はたらいたら"
        ],
        "kanji": [
          "働いたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "hatarakeba"
        ],
        "kana": [
          "はたらけば"
        ],
        "kanji": [
          "働けば"
        ]
      },
      "volitional": {
        "romaji": [
          "hatarakou"
        ],
        "kana": [
          "はたらこう"
        ],
        "kanji": [
          "働こう"
        ]
      },
      "potential": {
        "romaji": [
          "hatarakeru"
        ],
        "kana": [
          "はたらける"
        ],
        "kanji": [
          "働ける"
        ]
      },
      "passive": {
        "romaji": [
          "hatarakareru"
        ],
        "kana": [
          "はたらかれる"
        ],
        "kanji": [
          "働かれる"
        ]
      },
      "causative": {
        "romaji": [
          "hatarakaseru"
        ],
        "kana": [
          "はたらかせる"
        ],
        "kanji": [
          "働かせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "hatarakaserareru",
          "hatarakasareru"
        ],
        "kana": [
          "はたらかせられる",
          "はたらかされる"
        ],
        "kanji": [
          "働かせられる",
          "働かされる"
        ]
      },
      "imperative": {
        "romaji": [
          "hatarake"
        ],
        "kana": [
          "はたらけ"
        ],
        "kanji": [
          "働け"
        ]
      },
      "prohibitive": {
        "romaji": [
          "hatarakuna"
        ],
        "kana": [
          "はたらくな"
        ],
        "kanji": [
          "働くな"
        ]
      }
    }
  },
  {
    "id": "aruku",
    "type": "godan",
    "japanese": "歩く",
    "kana": "あるく",
    "meaningKey": "conjugations.verb.aruku",
    "conjugations": {
      "negative": {
        "romaji": [
          "arukanai"
        ],
        "kana": [
          "あるかない"
        ],
        "kanji": [
          "歩かない"
        ]
      },
      "past": {
        "romaji": [
          "aruita"
        ],
        "kana": [
          "あるいた"
        ],
        "kanji": [
          "歩いた"
        ]
      },
      "negativePast": {
        "romaji": [
          "arukanakatta"
        ],
        "kana": [
          "あるかなかった"
        ],
        "kanji": [
          "歩かなかった"
        ]
      },
      "te": {
        "romaji": [
          "aruite"
        ],
        "kana": [
          "あるいて"
        ],
        "kanji": [
          "歩いて"
        ]
      },
      "desire": {
        "kana": [
          "あるきたい"
        ],
        "kanji": [
          "歩きたい"
        ],
        "romaji": [
          "arukitai"
        ]
      },
      "polite": {
        "kana": [
          "あるきます"
        ],
        "kanji": [
          "歩きます"
        ],
        "romaji": [
          "arukimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "aruiteiru"
        ],
        "kana": [
          "あるいている"
        ],
        "kanji": [
          "歩いている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "aruitara"
        ],
        "kana": [
          "あるいたら"
        ],
        "kanji": [
          "歩いたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "arukeba"
        ],
        "kana": [
          "あるけば"
        ],
        "kanji": [
          "歩けば"
        ]
      },
      "volitional": {
        "romaji": [
          "arukou"
        ],
        "kana": [
          "あるこう"
        ],
        "kanji": [
          "歩こう"
        ]
      },
      "potential": {
        "romaji": [
          "arukeru"
        ],
        "kana": [
          "あるける"
        ],
        "kanji": [
          "歩ける"
        ]
      },
      "passive": {
        "romaji": [
          "arukareru"
        ],
        "kana": [
          "あるかれる"
        ],
        "kanji": [
          "歩かれる"
        ]
      },
      "causative": {
        "romaji": [
          "arukaseru"
        ],
        "kana": [
          "あるかせる"
        ],
        "kanji": [
          "歩かせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "arukaserareru",
          "arukasareru"
        ],
        "kana": [
          "あるかせられる",
          "あるかされる"
        ],
        "kanji": [
          "歩かせられる",
          "歩かされる"
        ]
      },
      "imperative": {
        "romaji": [
          "aruke"
        ],
        "kana": [
          "あるけ"
        ],
        "kanji": [
          "歩け"
        ]
      },
      "prohibitive": {
        "romaji": [
          "arukuna"
        ],
        "kana": [
          "あるくな"
        ],
        "kanji": [
          "歩くな"
        ]
      }
    }
  },
  {
    "id": "oyogu",
    "type": "godan",
    "japanese": "泳ぐ",
    "kana": "およぐ",
    "meaningKey": "conjugations.verb.oyogu",
    "conjugations": {
      "negative": {
        "romaji": [
          "oyoganai"
        ],
        "kana": [
          "およがない"
        ],
        "kanji": [
          "泳がない"
        ]
      },
      "past": {
        "romaji": [
          "oyoida"
        ],
        "kana": [
          "およいだ"
        ],
        "kanji": [
          "泳いだ"
        ]
      },
      "negativePast": {
        "romaji": [
          "oyoganakatta"
        ],
        "kana": [
          "およがなかった"
        ],
        "kanji": [
          "泳がなかった"
        ]
      },
      "te": {
        "romaji": [
          "oyoide"
        ],
        "kana": [
          "およいで"
        ],
        "kanji": [
          "泳いで"
        ]
      },
      "desire": {
        "kana": [
          "およぎたい"
        ],
        "kanji": [
          "泳ぎたい"
        ],
        "romaji": [
          "oyogitai"
        ]
      },
      "polite": {
        "kana": [
          "およぎます"
        ],
        "kanji": [
          "泳ぎます"
        ],
        "romaji": [
          "oyogimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "oyoideiru"
        ],
        "kana": [
          "およいでいる"
        ],
        "kanji": [
          "泳いでいる"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "oyoidara"
        ],
        "kana": [
          "およいだら"
        ],
        "kanji": [
          "泳いだら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "oyogeba"
        ],
        "kana": [
          "およげば"
        ],
        "kanji": [
          "泳げば"
        ]
      },
      "volitional": {
        "romaji": [
          "oyogou"
        ],
        "kana": [
          "およごう"
        ],
        "kanji": [
          "泳ごう"
        ]
      },
      "potential": {
        "romaji": [
          "oyogeru"
        ],
        "kana": [
          "およげる"
        ],
        "kanji": [
          "泳げる"
        ]
      },
      "passive": {
        "romaji": [
          "oyogareru"
        ],
        "kana": [
          "およがれる"
        ],
        "kanji": [
          "泳がれる"
        ]
      },
      "causative": {
        "romaji": [
          "oyogaseru"
        ],
        "kana": [
          "およがせる"
        ],
        "kanji": [
          "泳がせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "oyogaserareru",
          "oyogasareru"
        ],
        "kana": [
          "およがせられる",
          "およがされる"
        ],
        "kanji": [
          "泳がせられる",
          "泳がされる"
        ]
      },
      "imperative": {
        "romaji": [
          "oyoge"
        ],
        "kana": [
          "およげ"
        ],
        "kanji": [
          "泳げ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "oyoguna"
        ],
        "kana": [
          "およぐな"
        ],
        "kanji": [
          "泳ぐな"
        ]
      }
    }
  },
  {
    "id": "hanasu",
    "type": "godan",
    "japanese": "話す",
    "kana": "はなす",
    "meaningKey": "conjugations.verb.hanasu",
    "conjugations": {
      "negative": {
        "romaji": [
          "hanasanai"
        ],
        "kana": [
          "はなさない"
        ],
        "kanji": [
          "話さない"
        ]
      },
      "past": {
        "romaji": [
          "hanashita"
        ],
        "kana": [
          "はなした"
        ],
        "kanji": [
          "話した"
        ]
      },
      "negativePast": {
        "romaji": [
          "hanasanakatta"
        ],
        "kana": [
          "はなさなかった"
        ],
        "kanji": [
          "話さなかった"
        ]
      },
      "te": {
        "romaji": [
          "hanashite"
        ],
        "kana": [
          "はなして"
        ],
        "kanji": [
          "話して"
        ]
      },
      "desire": {
        "kana": [
          "はなしたい"
        ],
        "kanji": [
          "話したい"
        ],
        "romaji": [
          "hanashitai"
        ]
      },
      "polite": {
        "kana": [
          "はなします"
        ],
        "kanji": [
          "話します"
        ],
        "romaji": [
          "hanashimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "hanashiteiru"
        ],
        "kana": [
          "はなしている"
        ],
        "kanji": [
          "話している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "hanashitara"
        ],
        "kana": [
          "はなしたら"
        ],
        "kanji": [
          "話したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "hanaseba"
        ],
        "kana": [
          "はなせば"
        ],
        "kanji": [
          "話せば"
        ]
      },
      "volitional": {
        "romaji": [
          "hanasou"
        ],
        "kana": [
          "はなそう"
        ],
        "kanji": [
          "話そう"
        ]
      },
      "potential": {
        "romaji": [
          "hanaseru"
        ],
        "kana": [
          "はなせる"
        ],
        "kanji": [
          "話せる"
        ]
      },
      "passive": {
        "romaji": [
          "hanasareru"
        ],
        "kana": [
          "はなされる"
        ],
        "kanji": [
          "話される"
        ]
      },
      "causative": {
        "romaji": [
          "hanasaseru"
        ],
        "kana": [
          "はなさせる"
        ],
        "kanji": [
          "話させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "hanasaserareru"
        ],
        "kana": [
          "はなさせられる"
        ],
        "kanji": [
          "話させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "hanase"
        ],
        "kana": [
          "はなせ"
        ],
        "kanji": [
          "話せ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "hanasuna"
        ],
        "kana": [
          "はなすな"
        ],
        "kanji": [
          "話すな"
        ]
      }
    }
  },
  {
    "id": "dasu",
    "type": "godan",
    "japanese": "出す",
    "kana": "だす",
    "meaningKey": "conjugations.verb.dasu",
    "conjugations": {
      "negative": {
        "romaji": [
          "dasanai"
        ],
        "kana": [
          "ださない"
        ],
        "kanji": [
          "出さない"
        ]
      },
      "past": {
        "romaji": [
          "dashita"
        ],
        "kana": [
          "だした"
        ],
        "kanji": [
          "出した"
        ]
      },
      "negativePast": {
        "romaji": [
          "dasanakatta"
        ],
        "kana": [
          "ださなかった"
        ],
        "kanji": [
          "出さなかった"
        ]
      },
      "te": {
        "romaji": [
          "dashite"
        ],
        "kana": [
          "だして"
        ],
        "kanji": [
          "出して"
        ]
      },
      "desire": {
        "kana": [
          "だしたい"
        ],
        "kanji": [
          "出したい"
        ],
        "romaji": [
          "dashitai"
        ]
      },
      "polite": {
        "kana": [
          "だします"
        ],
        "kanji": [
          "出します"
        ],
        "romaji": [
          "dashimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "dashiteiru"
        ],
        "kana": [
          "だしている"
        ],
        "kanji": [
          "出している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "dashitara"
        ],
        "kana": [
          "だしたら"
        ],
        "kanji": [
          "出したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "daseba"
        ],
        "kana": [
          "だせば"
        ],
        "kanji": [
          "出せば"
        ]
      },
      "volitional": {
        "romaji": [
          "dasou"
        ],
        "kana": [
          "だそう"
        ],
        "kanji": [
          "出そう"
        ]
      },
      "potential": {
        "romaji": [
          "daseru"
        ],
        "kana": [
          "だせる"
        ],
        "kanji": [
          "出せる"
        ]
      },
      "passive": {
        "romaji": [
          "dasareru"
        ],
        "kana": [
          "だされる"
        ],
        "kanji": [
          "出される"
        ]
      },
      "causative": {
        "romaji": [
          "dasaseru"
        ],
        "kana": [
          "ださせる"
        ],
        "kanji": [
          "出させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "dasaserareru"
        ],
        "kana": [
          "ださせられる"
        ],
        "kanji": [
          "出させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "dase"
        ],
        "kana": [
          "だせ"
        ],
        "kanji": [
          "出せ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "dasuna"
        ],
        "kana": [
          "だすな"
        ],
        "kanji": [
          "出すな"
        ]
      }
    }
  },
  {
    "id": "sagasu",
    "type": "godan",
    "japanese": "探す",
    "kana": "さがす",
    "meaningKey": "conjugations.verb.sagasu",
    "conjugations": {
      "negative": {
        "romaji": [
          "sagasanai"
        ],
        "kana": [
          "さがさない"
        ],
        "kanji": [
          "探さない"
        ]
      },
      "past": {
        "romaji": [
          "sagashita"
        ],
        "kana": [
          "さがした"
        ],
        "kanji": [
          "探した"
        ]
      },
      "negativePast": {
        "romaji": [
          "sagasanakatta"
        ],
        "kana": [
          "さがさなかった"
        ],
        "kanji": [
          "探さなかった"
        ]
      },
      "te": {
        "romaji": [
          "sagashite"
        ],
        "kana": [
          "さがして"
        ],
        "kanji": [
          "探して"
        ]
      },
      "desire": {
        "kana": [
          "さがしたい"
        ],
        "kanji": [
          "探したい"
        ],
        "romaji": [
          "sagashitai"
        ]
      },
      "polite": {
        "kana": [
          "さがします"
        ],
        "kanji": [
          "探します"
        ],
        "romaji": [
          "sagashimasu"
        ]
      },
      "continuous": {
        "romaji": [
          "sagashiteiru"
        ],
        "kana": [
          "さがしている"
        ],
        "kanji": [
          "探している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "sagashitara"
        ],
        "kana": [
          "さがしたら"
        ],
        "kanji": [
          "探したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "sagaseba"
        ],
        "kana": [
          "さがせば"
        ],
        "kanji": [
          "探せば"
        ]
      },
      "volitional": {
        "romaji": [
          "sagasou"
        ],
        "kana": [
          "さがそう"
        ],
        "kanji": [
          "探そう"
        ]
      },
      "potential": {
        "romaji": [
          "sagaseru"
        ],
        "kana": [
          "さがせる"
        ],
        "kanji": [
          "探せる"
        ]
      },
      "passive": {
        "romaji": [
          "sagasareru"
        ],
        "kana": [
          "さがされる"
        ],
        "kanji": [
          "探される"
        ]
      },
      "causative": {
        "romaji": [
          "sagasaseru"
        ],
        "kana": [
          "さがさせる"
        ],
        "kanji": [
          "探させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "sagasaserareru"
        ],
        "kana": [
          "さがさせられる"
        ],
        "kanji": [
          "探させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "sagase"
        ],
        "kana": [
          "さがせ"
        ],
        "kanji": [
          "探せ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "sagasuna"
        ],
        "kana": [
          "さがすな"
        ],
        "kanji": [
          "探すな"
        ]
      }
    }
  },
  {
    "id": "taberu",
    "type": "ichidan",
    "japanese": "食べる",
    "kana": "たべる",
    "meaningKey": "conjugations.verb.taberu",
    "conjugations": {
      "negative": {
        "romaji": [
          "tabenai"
        ],
        "kana": [
          "たべない"
        ],
        "kanji": [
          "食べない"
        ]
      },
      "past": {
        "romaji": [
          "tabeta"
        ],
        "kana": [
          "たべた"
        ],
        "kanji": [
          "食べた"
        ]
      },
      "negativePast": {
        "romaji": [
          "tabenakatta"
        ],
        "kana": [
          "たべなかった"
        ],
        "kanji": [
          "食べなかった"
        ]
      },
      "te": {
        "romaji": [
          "tabete"
        ],
        "kana": [
          "たべて"
        ],
        "kanji": [
          "食べて"
        ]
      },
      "desire": {
        "romaji": [
          "tabetai"
        ],
        "kana": [
          "たべたい"
        ],
        "kanji": [
          "食べたい"
        ]
      },
      "polite": {
        "romaji": [
          "tabemasu"
        ],
        "kana": [
          "たべます"
        ],
        "kanji": [
          "食べます"
        ]
      },
      "continuous": {
        "romaji": [
          "tabeteiru"
        ],
        "kana": [
          "たべている"
        ],
        "kanji": [
          "食べている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "tabetara"
        ],
        "kana": [
          "たべたら"
        ],
        "kanji": [
          "食べたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "tabereba"
        ],
        "kana": [
          "たべれば"
        ],
        "kanji": [
          "食べれば"
        ]
      },
      "volitional": {
        "romaji": [
          "tabeyou"
        ],
        "kana": [
          "たべよう"
        ],
        "kanji": [
          "食べよう"
        ]
      },
      "potential": {
        "romaji": [
          "taberareru"
        ],
        "kana": [
          "たべられる"
        ],
        "kanji": [
          "食べられる"
        ]
      },
      "passive": {
        "romaji": [
          "taberareru"
        ],
        "kana": [
          "たべられる"
        ],
        "kanji": [
          "食べられる"
        ]
      },
      "causative": {
        "romaji": [
          "tabesaseru"
        ],
        "kana": [
          "たべさせる"
        ],
        "kanji": [
          "食べさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "tabesaserareru"
        ],
        "kana": [
          "たべさせられる"
        ],
        "kanji": [
          "食べさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "tabero",
          "tabeyo"
        ],
        "kana": [
          "たべろ",
          "たべよ"
        ],
        "kanji": [
          "食べろ",
          "食べよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "taberuna"
        ],
        "kana": [
          "たべるな"
        ],
        "kanji": [
          "食べるな"
        ]
      }
    }
  },
  {
    "id": "miru",
    "type": "ichidan",
    "japanese": "見る",
    "kana": "みる",
    "meaningKey": "conjugations.verb.miru",
    "conjugations": {
      "negative": {
        "romaji": [
          "minai"
        ],
        "kana": [
          "みない"
        ],
        "kanji": [
          "見ない"
        ]
      },
      "past": {
        "romaji": [
          "mita"
        ],
        "kana": [
          "みた"
        ],
        "kanji": [
          "見た"
        ]
      },
      "negativePast": {
        "romaji": [
          "minakatta"
        ],
        "kana": [
          "みなかった"
        ],
        "kanji": [
          "見なかった"
        ]
      },
      "te": {
        "romaji": [
          "mite"
        ],
        "kana": [
          "みて"
        ],
        "kanji": [
          "見て"
        ]
      },
      "desire": {
        "romaji": [
          "mitai"
        ],
        "kana": [
          "みたい"
        ],
        "kanji": [
          "見たい"
        ]
      },
      "polite": {
        "romaji": [
          "mimasu"
        ],
        "kana": [
          "みます"
        ],
        "kanji": [
          "見ます"
        ]
      },
      "continuous": {
        "romaji": [
          "miteiru"
        ],
        "kana": [
          "みている"
        ],
        "kanji": [
          "見ている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "mitara"
        ],
        "kana": [
          "みたら"
        ],
        "kanji": [
          "見たら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "mireba"
        ],
        "kana": [
          "みれば"
        ],
        "kanji": [
          "見れば"
        ]
      },
      "volitional": {
        "romaji": [
          "miyou"
        ],
        "kana": [
          "みよう"
        ],
        "kanji": [
          "見よう"
        ]
      },
      "potential": {
        "romaji": [
          "mirareru"
        ],
        "kana": [
          "みられる"
        ],
        "kanji": [
          "見られる"
        ]
      },
      "passive": {
        "romaji": [
          "mirareru"
        ],
        "kana": [
          "みられる"
        ],
        "kanji": [
          "見られる"
        ]
      },
      "causative": {
        "romaji": [
          "misaseru"
        ],
        "kana": [
          "みさせる"
        ],
        "kanji": [
          "見させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "misaserareru"
        ],
        "kana": [
          "みさせられる"
        ],
        "kanji": [
          "見させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "miro",
          "miyo"
        ],
        "kana": [
          "みろ",
          "みよ"
        ],
        "kanji": [
          "見ろ",
          "見よ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "miruna"
        ],
        "kana": [
          "みるな"
        ],
        "kanji": [
          "見るな"
        ]
      }
    }
  },
  {
    "id": "iru",
    "type": "ichidan",
    "japanese": "いる",
    "kana": "いる",
    "meaningKey": "conjugations.verb.iru",
    "conjugations": {
      "negative": {
        "romaji": [
          "inai"
        ],
        "kana": [
          "いない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "ita"
        ],
        "kana": [
          "いた"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "inakatta"
        ],
        "kana": [
          "いなかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "ite"
        ],
        "kana": [
          "いて"
        ],
        "kanji": []
      },
      "desire": {
        "romaji": [
          "itai"
        ],
        "kana": [
          "いたい"
        ],
        "kanji": []
      },
      "polite": {
        "romaji": [
          "imasu"
        ],
        "kana": [
          "います"
        ],
        "kanji": []
      },
      "conditionalTara": {
        "romaji": [
          "itara"
        ],
        "kana": [
          "いたら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "ireba"
        ],
        "kana": [
          "いれば"
        ],
        "kanji": []
      },
      "volitional": {
        "romaji": [
          "iyou"
        ],
        "kana": [
          "いよう"
        ],
        "kanji": []
      },
      "potential": {
        "romaji": [
          "irareru"
        ],
        "kana": [
          "いられる"
        ],
        "kanji": []
      },
      "causative": {
        "romaji": [
          "isaseru"
        ],
        "kana": [
          "いさせる"
        ],
        "kanji": []
      },
      "causativePassive": {
        "romaji": [
          "isaserareru"
        ],
        "kana": [
          "いさせられる"
        ],
        "kanji": []
      },
      "imperative": {
        "romaji": [
          "iro",
          "iyo"
        ],
        "kana": [
          "いろ",
          "いよ"
        ],
        "kanji": []
      },
      "prohibitive": {
        "romaji": [
          "iruna"
        ],
        "kana": [
          "いるな"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "okiru",
    "type": "ichidan",
    "japanese": "起きる",
    "kana": "おきる",
    "meaningKey": "conjugations.verb.okiru",
    "conjugations": {
      "negative": {
        "romaji": [
          "okinai"
        ],
        "kana": [
          "おきない"
        ],
        "kanji": [
          "起きない"
        ]
      },
      "past": {
        "romaji": [
          "okita"
        ],
        "kana": [
          "おきた"
        ],
        "kanji": [
          "起きた"
        ]
      },
      "negativePast": {
        "romaji": [
          "okinakatta"
        ],
        "kana": [
          "おきなかった"
        ],
        "kanji": [
          "起きなかった"
        ]
      },
      "te": {
        "romaji": [
          "okite"
        ],
        "kana": [
          "おきて"
        ],
        "kanji": [
          "起きて"
        ]
      },
      "desire": {
        "romaji": [
          "okitai"
        ],
        "kana": [
          "おきたい"
        ],
        "kanji": [
          "起きたい"
        ]
      },
      "polite": {
        "romaji": [
          "okimasu"
        ],
        "kana": [
          "おきます"
        ],
        "kanji": [
          "起きます"
        ]
      },
      "continuous": {
        "romaji": [
          "okiteiru"
        ],
        "kana": [
          "おきている"
        ],
        "kanji": [
          "起きている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "okitara"
        ],
        "kana": [
          "おきたら"
        ],
        "kanji": [
          "起きたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "okireba"
        ],
        "kana": [
          "おきれば"
        ],
        "kanji": [
          "起きれば"
        ]
      },
      "volitional": {
        "romaji": [
          "okiyou"
        ],
        "kana": [
          "おきよう"
        ],
        "kanji": [
          "起きよう"
        ]
      },
      "potential": {
        "romaji": [
          "okirareru"
        ],
        "kana": [
          "おきられる"
        ],
        "kanji": [
          "起きられる"
        ]
      },
      "passive": {
        "romaji": [
          "okirareru"
        ],
        "kana": [
          "おきられる"
        ],
        "kanji": [
          "起きられる"
        ]
      },
      "causative": {
        "romaji": [
          "okisaseru"
        ],
        "kana": [
          "おきさせる"
        ],
        "kanji": [
          "起きさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "okisaserareru"
        ],
        "kana": [
          "おきさせられる"
        ],
        "kanji": [
          "起きさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "okiro",
          "okiyo"
        ],
        "kana": [
          "おきろ",
          "おきよ"
        ],
        "kanji": [
          "起きろ",
          "起きよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "okiruna"
        ],
        "kana": [
          "おきるな"
        ],
        "kanji": [
          "起きるな"
        ]
      }
    }
  },
  {
    "id": "neru",
    "type": "ichidan",
    "japanese": "寝る",
    "kana": "ねる",
    "meaningKey": "conjugations.verb.neru",
    "conjugations": {
      "negative": {
        "romaji": [
          "nenai"
        ],
        "kana": [
          "ねない"
        ],
        "kanji": [
          "寝ない"
        ]
      },
      "past": {
        "romaji": [
          "neta"
        ],
        "kana": [
          "ねた"
        ],
        "kanji": [
          "寝た"
        ]
      },
      "negativePast": {
        "romaji": [
          "nenakatta"
        ],
        "kana": [
          "ねなかった"
        ],
        "kanji": [
          "寝なかった"
        ]
      },
      "te": {
        "romaji": [
          "nete"
        ],
        "kana": [
          "ねて"
        ],
        "kanji": [
          "寝て"
        ]
      },
      "desire": {
        "romaji": [
          "netai"
        ],
        "kana": [
          "ねたい"
        ],
        "kanji": [
          "寝たい"
        ]
      },
      "polite": {
        "romaji": [
          "nemasu"
        ],
        "kana": [
          "ねます"
        ],
        "kanji": [
          "寝ます"
        ]
      },
      "continuous": {
        "romaji": [
          "neteiru"
        ],
        "kana": [
          "ねている"
        ],
        "kanji": [
          "寝ている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "netara"
        ],
        "kana": [
          "ねたら"
        ],
        "kanji": [
          "寝たら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "nereba"
        ],
        "kana": [
          "ねれば"
        ],
        "kanji": [
          "寝れば"
        ]
      },
      "volitional": {
        "romaji": [
          "neyou"
        ],
        "kana": [
          "ねよう"
        ],
        "kanji": [
          "寝よう"
        ]
      },
      "potential": {
        "romaji": [
          "nerareru"
        ],
        "kana": [
          "ねられる"
        ],
        "kanji": [
          "寝られる"
        ]
      },
      "passive": {
        "romaji": [
          "nerareru"
        ],
        "kana": [
          "ねられる"
        ],
        "kanji": [
          "寝られる"
        ]
      },
      "causative": {
        "romaji": [
          "nesaseru"
        ],
        "kana": [
          "ねさせる"
        ],
        "kanji": [
          "寝させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "nesaserareru"
        ],
        "kana": [
          "ねさせられる"
        ],
        "kanji": [
          "寝させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "nero",
          "neyo"
        ],
        "kana": [
          "ねろ",
          "ねよ"
        ],
        "kanji": [
          "寝ろ",
          "寝よ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "neruna"
        ],
        "kana": [
          "ねるな"
        ],
        "kanji": [
          "寝るな"
        ]
      }
    }
  },
  {
    "id": "deru",
    "type": "ichidan",
    "japanese": "出る",
    "kana": "でる",
    "meaningKey": "conjugations.verb.deru",
    "conjugations": {
      "negative": {
        "romaji": [
          "denai"
        ],
        "kana": [
          "でない"
        ],
        "kanji": [
          "出ない"
        ]
      },
      "past": {
        "romaji": [
          "deta"
        ],
        "kana": [
          "でた"
        ],
        "kanji": [
          "出た"
        ]
      },
      "negativePast": {
        "romaji": [
          "denakatta"
        ],
        "kana": [
          "でなかった"
        ],
        "kanji": [
          "出なかった"
        ]
      },
      "te": {
        "romaji": [
          "dete"
        ],
        "kana": [
          "でて"
        ],
        "kanji": [
          "出て"
        ]
      },
      "desire": {
        "romaji": [
          "detai"
        ],
        "kana": [
          "でたい"
        ],
        "kanji": [
          "出たい"
        ]
      },
      "polite": {
        "romaji": [
          "demasu"
        ],
        "kana": [
          "でます"
        ],
        "kanji": [
          "出ます"
        ]
      },
      "continuous": {
        "romaji": [
          "deteiru"
        ],
        "kana": [
          "でている"
        ],
        "kanji": [
          "出ている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "detara"
        ],
        "kana": [
          "でたら"
        ],
        "kanji": [
          "出たら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "dereba"
        ],
        "kana": [
          "でれば"
        ],
        "kanji": [
          "出れば"
        ]
      },
      "volitional": {
        "romaji": [
          "deyou"
        ],
        "kana": [
          "でよう"
        ],
        "kanji": [
          "出よう"
        ]
      },
      "potential": {
        "romaji": [
          "derareru"
        ],
        "kana": [
          "でられる"
        ],
        "kanji": [
          "出られる"
        ]
      },
      "passive": {
        "romaji": [
          "derareru"
        ],
        "kana": [
          "でられる"
        ],
        "kanji": [
          "出られる"
        ]
      },
      "causative": {
        "romaji": [
          "desaseru"
        ],
        "kana": [
          "でさせる"
        ],
        "kanji": [
          "出させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "desaserareru"
        ],
        "kana": [
          "でさせられる"
        ],
        "kanji": [
          "出させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "dero",
          "deyo"
        ],
        "kana": [
          "でろ",
          "でよ"
        ],
        "kanji": [
          "出ろ",
          "出よ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "deruna"
        ],
        "kana": [
          "でるな"
        ],
        "kanji": [
          "出るな"
        ]
      }
    }
  },
  {
    "id": "akeru",
    "type": "ichidan",
    "japanese": "開ける",
    "kana": "あける",
    "meaningKey": "conjugations.verb.akeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "akenai"
        ],
        "kana": [
          "あけない"
        ],
        "kanji": [
          "開けない"
        ]
      },
      "past": {
        "romaji": [
          "aketa"
        ],
        "kana": [
          "あけた"
        ],
        "kanji": [
          "開けた"
        ]
      },
      "negativePast": {
        "romaji": [
          "akenakatta"
        ],
        "kana": [
          "あけなかった"
        ],
        "kanji": [
          "開けなかった"
        ]
      },
      "te": {
        "romaji": [
          "akete"
        ],
        "kana": [
          "あけて"
        ],
        "kanji": [
          "開けて"
        ]
      },
      "desire": {
        "romaji": [
          "aketai"
        ],
        "kana": [
          "あけたい"
        ],
        "kanji": [
          "開けたい"
        ]
      },
      "polite": {
        "romaji": [
          "akemasu"
        ],
        "kana": [
          "あけます"
        ],
        "kanji": [
          "開けます"
        ]
      },
      "continuous": {
        "romaji": [
          "aketeiru"
        ],
        "kana": [
          "あけている"
        ],
        "kanji": [
          "開けている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "aketara"
        ],
        "kana": [
          "あけたら"
        ],
        "kanji": [
          "開けたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "akereba"
        ],
        "kana": [
          "あければ"
        ],
        "kanji": [
          "開ければ"
        ]
      },
      "volitional": {
        "romaji": [
          "akeyou"
        ],
        "kana": [
          "あけよう"
        ],
        "kanji": [
          "開けよう"
        ]
      },
      "potential": {
        "romaji": [
          "akerareru"
        ],
        "kana": [
          "あけられる"
        ],
        "kanji": [
          "開けられる"
        ]
      },
      "passive": {
        "romaji": [
          "akerareru"
        ],
        "kana": [
          "あけられる"
        ],
        "kanji": [
          "開けられる"
        ]
      },
      "causative": {
        "romaji": [
          "akesaseru"
        ],
        "kana": [
          "あけさせる"
        ],
        "kanji": [
          "開けさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "akesaserareru"
        ],
        "kana": [
          "あけさせられる"
        ],
        "kanji": [
          "開けさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "akero",
          "akeyo"
        ],
        "kana": [
          "あけろ",
          "あけよ"
        ],
        "kanji": [
          "開けろ",
          "開けよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "akeruna"
        ],
        "kana": [
          "あけるな"
        ],
        "kanji": [
          "開けるな"
        ]
      }
    }
  },
  {
    "id": "shimeru",
    "type": "ichidan",
    "japanese": "閉める",
    "kana": "しめる",
    "meaningKey": "conjugations.verb.shimeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "shimenai"
        ],
        "kana": [
          "しめない"
        ],
        "kanji": [
          "閉めない"
        ]
      },
      "past": {
        "romaji": [
          "shimeta"
        ],
        "kana": [
          "しめた"
        ],
        "kanji": [
          "閉めた"
        ]
      },
      "negativePast": {
        "romaji": [
          "shimenakatta"
        ],
        "kana": [
          "しめなかった"
        ],
        "kanji": [
          "閉めなかった"
        ]
      },
      "te": {
        "romaji": [
          "shimete"
        ],
        "kana": [
          "しめて"
        ],
        "kanji": [
          "閉めて"
        ]
      },
      "desire": {
        "romaji": [
          "shimetai"
        ],
        "kana": [
          "しめたい"
        ],
        "kanji": [
          "閉めたい"
        ]
      },
      "polite": {
        "romaji": [
          "shimemasu"
        ],
        "kana": [
          "しめます"
        ],
        "kanji": [
          "閉めます"
        ]
      },
      "continuous": {
        "romaji": [
          "shimeteiru"
        ],
        "kana": [
          "しめている"
        ],
        "kanji": [
          "閉めている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "shimetara"
        ],
        "kana": [
          "しめたら"
        ],
        "kanji": [
          "閉めたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "shimereba"
        ],
        "kana": [
          "しめれば"
        ],
        "kanji": [
          "閉めれば"
        ]
      },
      "volitional": {
        "romaji": [
          "shimeyou"
        ],
        "kana": [
          "しめよう"
        ],
        "kanji": [
          "閉めよう"
        ]
      },
      "potential": {
        "romaji": [
          "shimerareru"
        ],
        "kana": [
          "しめられる"
        ],
        "kanji": [
          "閉められる"
        ]
      },
      "passive": {
        "romaji": [
          "shimerareru"
        ],
        "kana": [
          "しめられる"
        ],
        "kanji": [
          "閉められる"
        ]
      },
      "causative": {
        "romaji": [
          "shimesaseru"
        ],
        "kana": [
          "しめさせる"
        ],
        "kanji": [
          "閉めさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "shimesaserareru"
        ],
        "kana": [
          "しめさせられる"
        ],
        "kanji": [
          "閉めさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "shimero",
          "shimeyo"
        ],
        "kana": [
          "しめろ",
          "しめよ"
        ],
        "kanji": [
          "閉めろ",
          "閉めよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "shimeruna"
        ],
        "kana": [
          "しめるな"
        ],
        "kanji": [
          "閉めるな"
        ]
      }
    }
  },
  {
    "id": "tsukeru",
    "type": "ichidan",
    "japanese": "つける",
    "kana": "つける",
    "meaningKey": "conjugations.verb.tsukeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "tsukenai"
        ],
        "kana": [
          "つけない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "tsuketa"
        ],
        "kana": [
          "つけた"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "tsukenakatta"
        ],
        "kana": [
          "つけなかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "tsukete"
        ],
        "kana": [
          "つけて"
        ],
        "kanji": []
      },
      "desire": {
        "romaji": [
          "tsuketai"
        ],
        "kana": [
          "つけたい"
        ],
        "kanji": []
      },
      "polite": {
        "romaji": [
          "tsukemasu"
        ],
        "kana": [
          "つけます"
        ],
        "kanji": []
      },
      "continuous": {
        "romaji": [
          "tsuketeiru"
        ],
        "kana": [
          "つけている"
        ],
        "kanji": []
      },
      "conditionalTara": {
        "romaji": [
          "tsuketara"
        ],
        "kana": [
          "つけたら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "tsukereba"
        ],
        "kana": [
          "つければ"
        ],
        "kanji": []
      },
      "volitional": {
        "romaji": [
          "tsukeyou"
        ],
        "kana": [
          "つけよう"
        ],
        "kanji": []
      },
      "potential": {
        "romaji": [
          "tsukerareru"
        ],
        "kana": [
          "つけられる"
        ],
        "kanji": []
      },
      "passive": {
        "romaji": [
          "tsukerareru"
        ],
        "kana": [
          "つけられる"
        ],
        "kanji": []
      },
      "causative": {
        "romaji": [
          "tsukesaseru"
        ],
        "kana": [
          "つけさせる"
        ],
        "kanji": []
      },
      "causativePassive": {
        "romaji": [
          "tsukesaserareru"
        ],
        "kana": [
          "つけさせられる"
        ],
        "kanji": []
      },
      "imperative": {
        "romaji": [
          "tsukero",
          "tsukeyo"
        ],
        "kana": [
          "つけろ",
          "つけよ"
        ],
        "kanji": []
      },
      "prohibitive": {
        "romaji": [
          "tsukeruna"
        ],
        "kana": [
          "つけるな"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "kangaeru",
    "type": "ichidan",
    "japanese": "考える",
    "kana": "かんがえる",
    "meaningKey": "conjugations.verb.kangaeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "kangaenai"
        ],
        "kana": [
          "かんがえない"
        ],
        "kanji": [
          "考えない"
        ]
      },
      "past": {
        "romaji": [
          "kangaeta"
        ],
        "kana": [
          "かんがえた"
        ],
        "kanji": [
          "考えた"
        ]
      },
      "negativePast": {
        "romaji": [
          "kangaenakatta"
        ],
        "kana": [
          "かんがえなかった"
        ],
        "kanji": [
          "考えなかった"
        ]
      },
      "te": {
        "romaji": [
          "kangaete"
        ],
        "kana": [
          "かんがえて"
        ],
        "kanji": [
          "考えて"
        ]
      },
      "desire": {
        "romaji": [
          "kangaetai"
        ],
        "kana": [
          "かんがえたい"
        ],
        "kanji": [
          "考えたい"
        ]
      },
      "polite": {
        "romaji": [
          "kangaemasu"
        ],
        "kana": [
          "かんがえます"
        ],
        "kanji": [
          "考えます"
        ]
      },
      "continuous": {
        "romaji": [
          "kangaeteiru"
        ],
        "kana": [
          "かんがえている"
        ],
        "kanji": [
          "考えている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kangaetara"
        ],
        "kana": [
          "かんがえたら"
        ],
        "kanji": [
          "考えたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kangaereba"
        ],
        "kana": [
          "かんがえれば"
        ],
        "kanji": [
          "考えれば"
        ]
      },
      "volitional": {
        "romaji": [
          "kangaeyou"
        ],
        "kana": [
          "かんがえよう"
        ],
        "kanji": [
          "考えよう"
        ]
      },
      "potential": {
        "romaji": [
          "kangaerareru"
        ],
        "kana": [
          "かんがえられる"
        ],
        "kanji": [
          "考えられる"
        ]
      },
      "passive": {
        "romaji": [
          "kangaerareru"
        ],
        "kana": [
          "かんがえられる"
        ],
        "kanji": [
          "考えられる"
        ]
      },
      "causative": {
        "romaji": [
          "kangaesaseru"
        ],
        "kana": [
          "かんがえさせる"
        ],
        "kanji": [
          "考えさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kangaesaserareru"
        ],
        "kana": [
          "かんがえさせられる"
        ],
        "kanji": [
          "考えさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "kangaero",
          "kangaeyo"
        ],
        "kana": [
          "かんがえろ",
          "かんがえよ"
        ],
        "kanji": [
          "考えろ",
          "考えよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kangaeruna"
        ],
        "kana": [
          "かんがえるな"
        ],
        "kanji": [
          "考えるな"
        ]
      }
    }
  },
  {
    "id": "wasureru",
    "type": "ichidan",
    "japanese": "忘れる",
    "kana": "わすれる",
    "meaningKey": "conjugations.verb.wasureru",
    "conjugations": {
      "negative": {
        "romaji": [
          "wasurenai"
        ],
        "kana": [
          "わすれない"
        ],
        "kanji": [
          "忘れない"
        ]
      },
      "past": {
        "romaji": [
          "wasureta"
        ],
        "kana": [
          "わすれた"
        ],
        "kanji": [
          "忘れた"
        ]
      },
      "negativePast": {
        "romaji": [
          "wasurenakatta"
        ],
        "kana": [
          "わすれなかった"
        ],
        "kanji": [
          "忘れなかった"
        ]
      },
      "te": {
        "romaji": [
          "wasurete"
        ],
        "kana": [
          "わすれて"
        ],
        "kanji": [
          "忘れて"
        ]
      },
      "desire": {
        "romaji": [
          "wasuretai"
        ],
        "kana": [
          "わすれたい"
        ],
        "kanji": [
          "忘れたい"
        ]
      },
      "polite": {
        "romaji": [
          "wasuremasu"
        ],
        "kana": [
          "わすれます"
        ],
        "kanji": [
          "忘れます"
        ]
      },
      "continuous": {
        "romaji": [
          "wasureteiru"
        ],
        "kana": [
          "わすれている"
        ],
        "kanji": [
          "忘れている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "wasuretara"
        ],
        "kana": [
          "わすれたら"
        ],
        "kanji": [
          "忘れたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "wasurereba"
        ],
        "kana": [
          "わすれれば"
        ],
        "kanji": [
          "忘れれば"
        ]
      },
      "volitional": {
        "romaji": [
          "wasureyou"
        ],
        "kana": [
          "わすれよう"
        ],
        "kanji": [
          "忘れよう"
        ]
      },
      "potential": {
        "romaji": [
          "wasurerareru"
        ],
        "kana": [
          "わすれられる"
        ],
        "kanji": [
          "忘れられる"
        ]
      },
      "passive": {
        "romaji": [
          "wasurerareru"
        ],
        "kana": [
          "わすれられる"
        ],
        "kanji": [
          "忘れられる"
        ]
      },
      "causative": {
        "romaji": [
          "wasuresaseru"
        ],
        "kana": [
          "わすれさせる"
        ],
        "kanji": [
          "忘れさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "wasuresaserareru"
        ],
        "kana": [
          "わすれさせられる"
        ],
        "kanji": [
          "忘れさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "wasurero",
          "wasureyo"
        ],
        "kana": [
          "わすれろ",
          "わすれよ"
        ],
        "kanji": [
          "忘れろ",
          "忘れよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "wasureruna"
        ],
        "kana": [
          "わすれるな"
        ],
        "kanji": [
          "忘れるな"
        ]
      }
    }
  },
  {
    "id": "oboeru",
    "type": "ichidan",
    "japanese": "覚える",
    "kana": "おぼえる",
    "meaningKey": "conjugations.verb.oboeru",
    "conjugations": {
      "negative": {
        "romaji": [
          "oboenai"
        ],
        "kana": [
          "おぼえない"
        ],
        "kanji": [
          "覚えない"
        ]
      },
      "past": {
        "romaji": [
          "oboeta"
        ],
        "kana": [
          "おぼえた"
        ],
        "kanji": [
          "覚えた"
        ]
      },
      "negativePast": {
        "romaji": [
          "oboenakatta"
        ],
        "kana": [
          "おぼえなかった"
        ],
        "kanji": [
          "覚えなかった"
        ]
      },
      "te": {
        "romaji": [
          "oboete"
        ],
        "kana": [
          "おぼえて"
        ],
        "kanji": [
          "覚えて"
        ]
      },
      "desire": {
        "romaji": [
          "oboetai"
        ],
        "kana": [
          "おぼえたい"
        ],
        "kanji": [
          "覚えたい"
        ]
      },
      "polite": {
        "romaji": [
          "oboemasu"
        ],
        "kana": [
          "おぼえます"
        ],
        "kanji": [
          "覚えます"
        ]
      },
      "continuous": {
        "romaji": [
          "oboeteiru"
        ],
        "kana": [
          "おぼえている"
        ],
        "kanji": [
          "覚えている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "oboetara"
        ],
        "kana": [
          "おぼえたら"
        ],
        "kanji": [
          "覚えたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "oboereba"
        ],
        "kana": [
          "おぼえれば"
        ],
        "kanji": [
          "覚えれば"
        ]
      },
      "volitional": {
        "romaji": [
          "oboeyou"
        ],
        "kana": [
          "おぼえよう"
        ],
        "kanji": [
          "覚えよう"
        ]
      },
      "potential": {
        "romaji": [
          "oboerareru"
        ],
        "kana": [
          "おぼえられる"
        ],
        "kanji": [
          "覚えられる"
        ]
      },
      "passive": {
        "romaji": [
          "oboerareru"
        ],
        "kana": [
          "おぼえられる"
        ],
        "kanji": [
          "覚えられる"
        ]
      },
      "causative": {
        "romaji": [
          "oboesaseru"
        ],
        "kana": [
          "おぼえさせる"
        ],
        "kanji": [
          "覚えさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "oboesaserareru"
        ],
        "kana": [
          "おぼえさせられる"
        ],
        "kanji": [
          "覚えさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "oboero",
          "oboeyo"
        ],
        "kana": [
          "おぼえろ",
          "おぼえよ"
        ],
        "kanji": [
          "覚えろ",
          "覚えよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "oboeruna"
        ],
        "kana": [
          "おぼえるな"
        ],
        "kanji": [
          "覚えるな"
        ]
      }
    }
  },
  {
    "id": "oshieru",
    "type": "ichidan",
    "japanese": "教える",
    "kana": "おしえる",
    "meaningKey": "conjugations.verb.oshieru",
    "conjugations": {
      "negative": {
        "romaji": [
          "oshienai"
        ],
        "kana": [
          "おしえない"
        ],
        "kanji": [
          "教えない"
        ]
      },
      "past": {
        "romaji": [
          "oshieta"
        ],
        "kana": [
          "おしえた"
        ],
        "kanji": [
          "教えた"
        ]
      },
      "negativePast": {
        "romaji": [
          "oshienakatta"
        ],
        "kana": [
          "おしえなかった"
        ],
        "kanji": [
          "教えなかった"
        ]
      },
      "te": {
        "romaji": [
          "oshiete"
        ],
        "kana": [
          "おしえて"
        ],
        "kanji": [
          "教えて"
        ]
      },
      "desire": {
        "romaji": [
          "oshietai"
        ],
        "kana": [
          "おしえたい"
        ],
        "kanji": [
          "教えたい"
        ]
      },
      "polite": {
        "romaji": [
          "oshiemasu"
        ],
        "kana": [
          "おしえます"
        ],
        "kanji": [
          "教えます"
        ]
      },
      "continuous": {
        "romaji": [
          "oshieteiru"
        ],
        "kana": [
          "おしえている"
        ],
        "kanji": [
          "教えている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "oshietara"
        ],
        "kana": [
          "おしえたら"
        ],
        "kanji": [
          "教えたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "oshiereba"
        ],
        "kana": [
          "おしえれば"
        ],
        "kanji": [
          "教えれば"
        ]
      },
      "volitional": {
        "romaji": [
          "oshieyou"
        ],
        "kana": [
          "おしえよう"
        ],
        "kanji": [
          "教えよう"
        ]
      },
      "potential": {
        "romaji": [
          "oshierareru"
        ],
        "kana": [
          "おしえられる"
        ],
        "kanji": [
          "教えられる"
        ]
      },
      "passive": {
        "romaji": [
          "oshierareru"
        ],
        "kana": [
          "おしえられる"
        ],
        "kanji": [
          "教えられる"
        ]
      },
      "causative": {
        "romaji": [
          "oshiesaseru"
        ],
        "kana": [
          "おしえさせる"
        ],
        "kanji": [
          "教えさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "oshiesaserareru"
        ],
        "kana": [
          "おしえさせられる"
        ],
        "kanji": [
          "教えさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "oshiero",
          "oshieyo"
        ],
        "kana": [
          "おしえろ",
          "おしえよ"
        ],
        "kanji": [
          "教えろ",
          "教えよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "oshieruna"
        ],
        "kana": [
          "おしえるな"
        ],
        "kanji": [
          "教えるな"
        ]
      }
    }
  },
  {
    "id": "kariru",
    "type": "ichidan",
    "japanese": "借りる",
    "kana": "かりる",
    "meaningKey": "conjugations.verb.kariru",
    "conjugations": {
      "negative": {
        "romaji": [
          "karinai"
        ],
        "kana": [
          "かりない"
        ],
        "kanji": [
          "借りない"
        ]
      },
      "past": {
        "romaji": [
          "karita"
        ],
        "kana": [
          "かりた"
        ],
        "kanji": [
          "借りた"
        ]
      },
      "negativePast": {
        "romaji": [
          "karinakatta"
        ],
        "kana": [
          "かりなかった"
        ],
        "kanji": [
          "借りなかった"
        ]
      },
      "te": {
        "romaji": [
          "karite"
        ],
        "kana": [
          "かりて"
        ],
        "kanji": [
          "借りて"
        ]
      },
      "desire": {
        "romaji": [
          "karitai"
        ],
        "kana": [
          "かりたい"
        ],
        "kanji": [
          "借りたい"
        ]
      },
      "polite": {
        "romaji": [
          "karimasu"
        ],
        "kana": [
          "かります"
        ],
        "kanji": [
          "借ります"
        ]
      },
      "continuous": {
        "romaji": [
          "kariteiru"
        ],
        "kana": [
          "かりている"
        ],
        "kanji": [
          "借りている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "karitara"
        ],
        "kana": [
          "かりたら"
        ],
        "kanji": [
          "借りたら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "karireba"
        ],
        "kana": [
          "かりれば"
        ],
        "kanji": [
          "借りれば"
        ]
      },
      "volitional": {
        "romaji": [
          "kariyou"
        ],
        "kana": [
          "かりよう"
        ],
        "kanji": [
          "借りよう"
        ]
      },
      "potential": {
        "romaji": [
          "karirareru"
        ],
        "kana": [
          "かりられる"
        ],
        "kanji": [
          "借りられる"
        ]
      },
      "passive": {
        "romaji": [
          "karirareru"
        ],
        "kana": [
          "かりられる"
        ],
        "kanji": [
          "借りられる"
        ]
      },
      "causative": {
        "romaji": [
          "karisaseru"
        ],
        "kana": [
          "かりさせる"
        ],
        "kanji": [
          "借りさせる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "karisaserareru"
        ],
        "kana": [
          "かりさせられる"
        ],
        "kanji": [
          "借りさせられる"
        ]
      },
      "imperative": {
        "romaji": [
          "kariro",
          "kariyo"
        ],
        "kana": [
          "かりろ",
          "かりよ"
        ],
        "kanji": [
          "借りろ",
          "借りよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kariruna"
        ],
        "kana": [
          "かりるな"
        ],
        "kanji": [
          "借りるな"
        ]
      }
    }
  },
  {
    "id": "dekiru",
    "type": "ichidan",
    "japanese": "できる",
    "kana": "できる",
    "meaningKey": "conjugations.verb.dekiru",
    "conjugations": {
      "negative": {
        "romaji": [
          "dekinai"
        ],
        "kana": [
          "できない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "dekita"
        ],
        "kana": [
          "できた"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "dekinakatta"
        ],
        "kana": [
          "できなかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "dekite"
        ],
        "kana": [
          "できて"
        ],
        "kanji": []
      },
      "polite": {
        "romaji": [
          "dekimasu"
        ],
        "kana": [
          "できます"
        ],
        "kanji": []
      },
      "continuous": {
        "romaji": [
          "dekiteiru"
        ],
        "kana": [
          "できている"
        ],
        "kanji": []
      },
      "conditionalTara": {
        "romaji": [
          "dekitara"
        ],
        "kana": [
          "できたら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "dekireba"
        ],
        "kana": [
          "できれば"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "suru",
    "type": "irregular",
    "japanese": "する",
    "kana": "する",
    "meaningKey": "conjugations.verb.suru",
    "conjugations": {
      "negative": {
        "romaji": [
          "shinai"
        ],
        "kana": [
          "しない"
        ],
        "kanji": []
      },
      "past": {
        "romaji": [
          "shita"
        ],
        "kana": [
          "した"
        ],
        "kanji": []
      },
      "negativePast": {
        "romaji": [
          "shinakatta"
        ],
        "kana": [
          "しなかった"
        ],
        "kanji": []
      },
      "te": {
        "romaji": [
          "shite"
        ],
        "kana": [
          "して"
        ],
        "kanji": []
      },
      "desire": {
        "romaji": [
          "shitai"
        ],
        "kana": [
          "したい"
        ],
        "kanji": []
      },
      "polite": {
        "romaji": [
          "shimasu"
        ],
        "kana": [
          "します"
        ],
        "kanji": []
      },
      "continuous": {
        "romaji": [
          "shiteiru"
        ],
        "kana": [
          "している"
        ],
        "kanji": []
      },
      "conditionalTara": {
        "romaji": [
          "shitara"
        ],
        "kana": [
          "したら"
        ],
        "kanji": []
      },
      "conditionalBa": {
        "romaji": [
          "sureba"
        ],
        "kana": [
          "すれば"
        ],
        "kanji": []
      },
      "volitional": {
        "romaji": [
          "shiyou"
        ],
        "kana": [
          "しよう"
        ],
        "kanji": []
      },
      "potential": {
        "romaji": [
          "dekiru"
        ],
        "kana": [
          "できる"
        ],
        "kanji": []
      },
      "passive": {
        "romaji": [
          "sareru"
        ],
        "kana": [
          "される"
        ],
        "kanji": []
      },
      "causative": {
        "romaji": [
          "saseru"
        ],
        "kana": [
          "させる"
        ],
        "kanji": []
      },
      "causativePassive": {
        "romaji": [
          "saserareru"
        ],
        "kana": [
          "させられる"
        ],
        "kanji": []
      },
      "imperative": {
        "romaji": [
          "shiro",
          "seyo"
        ],
        "kana": [
          "しろ",
          "せよ"
        ],
        "kanji": []
      },
      "prohibitive": {
        "romaji": [
          "suruna"
        ],
        "kana": [
          "するな"
        ],
        "kanji": []
      }
    }
  },
  {
    "id": "kuru",
    "type": "irregular",
    "japanese": "来る",
    "kana": "くる",
    "meaningKey": "conjugations.verb.kuru",
    "conjugations": {
      "negative": {
        "romaji": [
          "konai"
        ],
        "kana": [
          "こない"
        ],
        "kanji": [
          "来ない"
        ]
      },
      "past": {
        "romaji": [
          "kita"
        ],
        "kana": [
          "きた"
        ],
        "kanji": [
          "来た"
        ]
      },
      "negativePast": {
        "romaji": [
          "konakatta"
        ],
        "kana": [
          "こなかった"
        ],
        "kanji": [
          "来なかった"
        ]
      },
      "te": {
        "romaji": [
          "kite"
        ],
        "kana": [
          "きて"
        ],
        "kanji": [
          "来て"
        ]
      },
      "desire": {
        "romaji": [
          "kitai"
        ],
        "kana": [
          "きたい"
        ],
        "kanji": [
          "来たい"
        ]
      },
      "polite": {
        "romaji": [
          "kimasu"
        ],
        "kana": [
          "きます"
        ],
        "kanji": [
          "来ます"
        ]
      },
      "continuous": {
        "romaji": [
          "kiteiru"
        ],
        "kana": [
          "きている"
        ],
        "kanji": [
          "来ている"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "kitara"
        ],
        "kana": [
          "きたら"
        ],
        "kanji": [
          "来たら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "kureba"
        ],
        "kana": [
          "くれば"
        ],
        "kanji": [
          "来れば"
        ]
      },
      "volitional": {
        "romaji": [
          "koyou"
        ],
        "kana": [
          "こよう"
        ],
        "kanji": [
          "来よう"
        ]
      },
      "potential": {
        "romaji": [
          "korareru"
        ],
        "kana": [
          "こられる"
        ],
        "kanji": [
          "来られる"
        ]
      },
      "passive": {
        "romaji": [
          "korareru"
        ],
        "kana": [
          "こられる"
        ],
        "kanji": [
          "来られる"
        ]
      },
      "causative": {
        "romaji": [
          "kosaseru"
        ],
        "kana": [
          "こさせる"
        ],
        "kanji": [
          "来させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "kosaserareru"
        ],
        "kana": [
          "こさせられる"
        ],
        "kanji": [
          "来させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "koi"
        ],
        "kana": [
          "こい"
        ],
        "kanji": [
          "来い"
        ]
      },
      "prohibitive": {
        "romaji": [
          "kuruna"
        ],
        "kana": [
          "くるな"
        ],
        "kanji": [
          "来るな"
        ]
      }
    }
  },
  {
    "id": "benkyou-suru",
    "type": "irregular",
    "japanese": "勉強する",
    "kana": "べんきょうする",
    "meaningKey": "conjugations.verb.benkyou-suru",
    "conjugations": {
      "negative": {
        "romaji": [
          "benkyoushinai",
          "benkyou shinai"
        ],
        "kana": [
          "べんきょうしない"
        ],
        "kanji": [
          "勉強しない"
        ]
      },
      "past": {
        "romaji": [
          "benkyoushita",
          "benkyou shita"
        ],
        "kana": [
          "べんきょうした"
        ],
        "kanji": [
          "勉強した"
        ]
      },
      "negativePast": {
        "romaji": [
          "benkyoushinakatta",
          "benkyou shinakatta"
        ],
        "kana": [
          "べんきょうしなかった"
        ],
        "kanji": [
          "勉強しなかった"
        ]
      },
      "te": {
        "romaji": [
          "benkyoushite",
          "benkyou shite"
        ],
        "kana": [
          "べんきょうして"
        ],
        "kanji": [
          "勉強して"
        ]
      },
      "desire": {
        "romaji": [
          "benkyoushitai",
          "benkyou shitai"
        ],
        "kana": [
          "べんきょうしたい"
        ],
        "kanji": [
          "勉強したい"
        ]
      },
      "polite": {
        "romaji": [
          "benkyoushimasu",
          "benkyou shimasu"
        ],
        "kana": [
          "べんきょうします"
        ],
        "kanji": [
          "勉強します"
        ]
      },
      "continuous": {
        "romaji": [
          "benkyoushiteiru",
          "benkyou shiteiru"
        ],
        "kana": [
          "べんきょうしている"
        ],
        "kanji": [
          "勉強している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "benkyoushitara",
          "benkyou shitara"
        ],
        "kana": [
          "べんきょうしたら"
        ],
        "kanji": [
          "勉強したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "benkyousureba",
          "benkyou sureba"
        ],
        "kana": [
          "べんきょうすれば"
        ],
        "kanji": [
          "勉強すれば"
        ]
      },
      "volitional": {
        "romaji": [
          "benkyoushiyou",
          "benkyou shiyou"
        ],
        "kana": [
          "べんきょうしよう"
        ],
        "kanji": [
          "勉強しよう"
        ]
      },
      "potential": {
        "romaji": [
          "benkyoudekiru",
          "benkyou dekiru"
        ],
        "kana": [
          "べんきょうできる"
        ],
        "kanji": [
          "勉強できる"
        ]
      },
      "passive": {
        "romaji": [
          "benkyousareru",
          "benkyou sareru"
        ],
        "kana": [
          "べんきょうされる"
        ],
        "kanji": [
          "勉強される"
        ]
      },
      "causative": {
        "romaji": [
          "benkyousaseru",
          "benkyou saseru"
        ],
        "kana": [
          "べんきょうさせる"
        ],
        "kanji": [
          "勉強させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "benkyousaserareru",
          "benkyou saserareru"
        ],
        "kana": [
          "べんきょうさせられる"
        ],
        "kanji": [
          "勉強させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "benkyoushiro",
          "benkyouseyo",
          "benkyou shiro",
          "benkyou seyo"
        ],
        "kana": [
          "べんきょうしろ",
          "べんきょうせよ"
        ],
        "kanji": [
          "勉強しろ",
          "勉強せよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "benkyousuruna",
          "benkyou suruna"
        ],
        "kana": [
          "べんきょうするな"
        ],
        "kanji": [
          "勉強するな"
        ]
      }
    }
  },
  {
    "id": "ryouri-suru",
    "type": "irregular",
    "japanese": "料理する",
    "kana": "りょうりする",
    "meaningKey": "conjugations.verb.ryouri-suru",
    "conjugations": {
      "negative": {
        "romaji": [
          "ryourishinai",
          "ryouri shinai"
        ],
        "kana": [
          "りょうりしない"
        ],
        "kanji": [
          "料理しない"
        ]
      },
      "past": {
        "romaji": [
          "ryourishita",
          "ryouri shita"
        ],
        "kana": [
          "りょうりした"
        ],
        "kanji": [
          "料理した"
        ]
      },
      "negativePast": {
        "romaji": [
          "ryourishinakatta",
          "ryouri shinakatta"
        ],
        "kana": [
          "りょうりしなかった"
        ],
        "kanji": [
          "料理しなかった"
        ]
      },
      "te": {
        "romaji": [
          "ryourishite",
          "ryouri shite"
        ],
        "kana": [
          "りょうりして"
        ],
        "kanji": [
          "料理して"
        ]
      },
      "desire": {
        "romaji": [
          "ryourishitai",
          "ryouri shitai"
        ],
        "kana": [
          "りょうりしたい"
        ],
        "kanji": [
          "料理したい"
        ]
      },
      "polite": {
        "romaji": [
          "ryourishimasu",
          "ryouri shimasu"
        ],
        "kana": [
          "りょうりします"
        ],
        "kanji": [
          "料理します"
        ]
      },
      "continuous": {
        "romaji": [
          "ryourishiteiru",
          "ryouri shiteiru"
        ],
        "kana": [
          "りょうりしている"
        ],
        "kanji": [
          "料理している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "ryourishitara",
          "ryouri shitara"
        ],
        "kana": [
          "りょうりしたら"
        ],
        "kanji": [
          "料理したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "ryourisureba",
          "ryouri sureba"
        ],
        "kana": [
          "りょうりすれば"
        ],
        "kanji": [
          "料理すれば"
        ]
      },
      "volitional": {
        "romaji": [
          "ryourishiyou",
          "ryouri shiyou"
        ],
        "kana": [
          "りょうりしよう"
        ],
        "kanji": [
          "料理しよう"
        ]
      },
      "potential": {
        "romaji": [
          "ryouridekiru",
          "ryouri dekiru"
        ],
        "kana": [
          "りょうりできる"
        ],
        "kanji": [
          "料理できる"
        ]
      },
      "passive": {
        "romaji": [
          "ryourisareru",
          "ryouri sareru"
        ],
        "kana": [
          "りょうりされる"
        ],
        "kanji": [
          "料理される"
        ]
      },
      "causative": {
        "romaji": [
          "ryourisaseru",
          "ryouri saseru"
        ],
        "kana": [
          "りょうりさせる"
        ],
        "kanji": [
          "料理させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "ryourisaserareru",
          "ryouri saserareru"
        ],
        "kana": [
          "りょうりさせられる"
        ],
        "kanji": [
          "料理させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "ryourishiro",
          "ryouriseyo",
          "ryouri shiro",
          "ryouri seyo"
        ],
        "kana": [
          "りょうりしろ",
          "りょうりせよ"
        ],
        "kanji": [
          "料理しろ",
          "料理せよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "ryourisuruna",
          "ryouri suruna"
        ],
        "kana": [
          "りょうりするな"
        ],
        "kanji": [
          "料理するな"
        ]
      }
    }
  },
  {
    "id": "unten-suru",
    "type": "irregular",
    "japanese": "運転する",
    "kana": "うんてんする",
    "meaningKey": "conjugations.verb.unten-suru",
    "conjugations": {
      "negative": {
        "romaji": [
          "untenshinai",
          "unten shinai"
        ],
        "kana": [
          "うんてんしない"
        ],
        "kanji": [
          "運転しない"
        ]
      },
      "past": {
        "romaji": [
          "untenshita",
          "unten shita"
        ],
        "kana": [
          "うんてんした"
        ],
        "kanji": [
          "運転した"
        ]
      },
      "negativePast": {
        "romaji": [
          "untenshinakatta",
          "unten shinakatta"
        ],
        "kana": [
          "うんてんしなかった"
        ],
        "kanji": [
          "運転しなかった"
        ]
      },
      "te": {
        "romaji": [
          "untenshite",
          "unten shite"
        ],
        "kana": [
          "うんてんして"
        ],
        "kanji": [
          "運転して"
        ]
      },
      "desire": {
        "romaji": [
          "untenshitai",
          "unten shitai"
        ],
        "kana": [
          "うんてんしたい"
        ],
        "kanji": [
          "運転したい"
        ]
      },
      "polite": {
        "romaji": [
          "untenshimasu",
          "unten shimasu"
        ],
        "kana": [
          "うんてんします"
        ],
        "kanji": [
          "運転します"
        ]
      },
      "continuous": {
        "romaji": [
          "untenshiteiru",
          "unten shiteiru"
        ],
        "kana": [
          "うんてんしている"
        ],
        "kanji": [
          "運転している"
        ]
      },
      "conditionalTara": {
        "romaji": [
          "untenshitara",
          "unten shitara"
        ],
        "kana": [
          "うんてんしたら"
        ],
        "kanji": [
          "運転したら"
        ]
      },
      "conditionalBa": {
        "romaji": [
          "untensureba",
          "unten sureba"
        ],
        "kana": [
          "うんてんすれば"
        ],
        "kanji": [
          "運転すれば"
        ]
      },
      "volitional": {
        "romaji": [
          "untenshiyou",
          "unten shiyou"
        ],
        "kana": [
          "うんてんしよう"
        ],
        "kanji": [
          "運転しよう"
        ]
      },
      "potential": {
        "romaji": [
          "untendekiru",
          "unten dekiru"
        ],
        "kana": [
          "うんてんできる"
        ],
        "kanji": [
          "運転できる"
        ]
      },
      "passive": {
        "romaji": [
          "untensareru",
          "unten sareru"
        ],
        "kana": [
          "うんてんされる"
        ],
        "kanji": [
          "運転される"
        ]
      },
      "causative": {
        "romaji": [
          "untensaseru",
          "unten saseru"
        ],
        "kana": [
          "うんてんさせる"
        ],
        "kanji": [
          "運転させる"
        ]
      },
      "causativePassive": {
        "romaji": [
          "untensaserareru",
          "unten saserareru"
        ],
        "kana": [
          "うんてんさせられる"
        ],
        "kanji": [
          "運転させられる"
        ]
      },
      "imperative": {
        "romaji": [
          "untenshiro",
          "untenseyo",
          "unten shiro",
          "unten seyo"
        ],
        "kana": [
          "うんてんしろ",
          "うんてんせよ"
        ],
        "kanji": [
          "運転しろ",
          "運転せよ"
        ]
      },
      "prohibitive": {
        "romaji": [
          "untensuruna",
          "unten suruna"
        ],
        "kana": [
          "うんてんするな"
        ],
        "kanji": [
          "運転するな"
        ]
      }
    }
  }
];
