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
      }
    }
  }
];
