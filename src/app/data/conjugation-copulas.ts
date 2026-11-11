import {ConjugationCopula} from '../core/models/conjugation-practice.model';

// Literal complete nominal/na predicates. No i-adjectives or ordinary verbs.
export const CONJUGATION_COPULAS:readonly ConjugationCopula[] = [
  {
    "id": "gakusei",
    "type": "noun",
    "meaningKey": "conjugations.copula.word.gakusei",
    "registers": {
      "plain": {
        "japanese": "学生だ",
        "kana": "がくせいだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "がくせいだ"
            ],
            "kanji": [
              "学生だ"
            ],
            "romaji": [
              "gakuseida"
            ]
          },
          "negative": {
            "kana": [
              "がくせいじゃない",
              "がくせいではない"
            ],
            "kanji": [
              "学生じゃない",
              "学生ではない"
            ],
            "romaji": [
              "gakuseijanai",
              "gakuseidewanai"
            ]
          },
          "past": {
            "kana": [
              "がくせいだった"
            ],
            "kanji": [
              "学生だった"
            ],
            "romaji": [
              "gakuseidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "がくせいじゃなかった",
              "がくせいではなかった"
            ],
            "kanji": [
              "学生じゃなかった",
              "学生ではなかった"
            ],
            "romaji": [
              "gakuseijanakatta",
              "gakuseidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "学生です",
        "kana": "がくせいです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "がくせいです"
            ],
            "kanji": [
              "学生です"
            ],
            "romaji": [
              "gakuseidesu"
            ]
          },
          "negative": {
            "kana": [
              "がくせいではありません",
              "がくせいじゃありません",
              "がくせいではないです",
              "がくせいじゃないです"
            ],
            "kanji": [
              "学生ではありません",
              "学生じゃありません",
              "学生ではないです",
              "学生じゃないです"
            ],
            "romaji": [
              "gakuseidewaarimasen",
              "gakuseijaarimasen",
              "gakuseidewanaidesu",
              "gakuseijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "がくせいでした"
            ],
            "kanji": [
              "学生でした"
            ],
            "romaji": [
              "gakuseideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "がくせいではありませんでした",
              "がくせいじゃありませんでした",
              "がくせいではなかったです",
              "がくせいじゃなかったです"
            ],
            "kanji": [
              "学生ではありませんでした",
              "学生じゃありませんでした",
              "学生ではなかったです",
              "学生じゃなかったです"
            ],
            "romaji": [
              "gakuseidewaarimasendeshita",
              "gakuseijaarimasendeshita",
              "gakuseidewanakattadesu",
              "gakuseijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "sensei",
    "type": "noun",
    "meaningKey": "conjugations.copula.word.sensei",
    "registers": {
      "plain": {
        "japanese": "先生だ",
        "kana": "せんせいだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "せんせいだ"
            ],
            "kanji": [
              "先生だ"
            ],
            "romaji": [
              "senseida"
            ]
          },
          "negative": {
            "kana": [
              "せんせいじゃない",
              "せんせいではない"
            ],
            "kanji": [
              "先生じゃない",
              "先生ではない"
            ],
            "romaji": [
              "senseijanai",
              "senseidewanai"
            ]
          },
          "past": {
            "kana": [
              "せんせいだった"
            ],
            "kanji": [
              "先生だった"
            ],
            "romaji": [
              "senseidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "せんせいじゃなかった",
              "せんせいではなかった"
            ],
            "kanji": [
              "先生じゃなかった",
              "先生ではなかった"
            ],
            "romaji": [
              "senseijanakatta",
              "senseidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "先生です",
        "kana": "せんせいです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "せんせいです"
            ],
            "kanji": [
              "先生です"
            ],
            "romaji": [
              "senseidesu"
            ]
          },
          "negative": {
            "kana": [
              "せんせいではありません",
              "せんせいじゃありません",
              "せんせいではないです",
              "せんせいじゃないです"
            ],
            "kanji": [
              "先生ではありません",
              "先生じゃありません",
              "先生ではないです",
              "先生じゃないです"
            ],
            "romaji": [
              "senseidewaarimasen",
              "senseijaarimasen",
              "senseidewanaidesu",
              "senseijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "せんせいでした"
            ],
            "kanji": [
              "先生でした"
            ],
            "romaji": [
              "senseideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "せんせいではありませんでした",
              "せんせいじゃありませんでした",
              "せんせいではなかったです",
              "せんせいじゃなかったです"
            ],
            "kanji": [
              "先生ではありませんでした",
              "先生じゃありませんでした",
              "先生ではなかったです",
              "先生じゃなかったです"
            ],
            "romaji": [
              "senseidewaarimasendeshita",
              "senseijaarimasendeshita",
              "senseidewanakattadesu",
              "senseijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "tomodachi",
    "type": "noun",
    "meaningKey": "conjugations.copula.word.tomodachi",
    "registers": {
      "plain": {
        "japanese": "友達だ",
        "kana": "ともだちだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "ともだちだ"
            ],
            "kanji": [
              "友達だ"
            ],
            "romaji": [
              "tomodachida"
            ]
          },
          "negative": {
            "kana": [
              "ともだちじゃない",
              "ともだちではない"
            ],
            "kanji": [
              "友達じゃない",
              "友達ではない"
            ],
            "romaji": [
              "tomodachijanai",
              "tomodachidewanai"
            ]
          },
          "past": {
            "kana": [
              "ともだちだった"
            ],
            "kanji": [
              "友達だった"
            ],
            "romaji": [
              "tomodachidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "ともだちじゃなかった",
              "ともだちではなかった"
            ],
            "kanji": [
              "友達じゃなかった",
              "友達ではなかった"
            ],
            "romaji": [
              "tomodachijanakatta",
              "tomodachidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "友達です",
        "kana": "ともだちです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "ともだちです"
            ],
            "kanji": [
              "友達です"
            ],
            "romaji": [
              "tomodachidesu"
            ]
          },
          "negative": {
            "kana": [
              "ともだちではありません",
              "ともだちじゃありません",
              "ともだちではないです",
              "ともだちじゃないです"
            ],
            "kanji": [
              "友達ではありません",
              "友達じゃありません",
              "友達ではないです",
              "友達じゃないです"
            ],
            "romaji": [
              "tomodachidewaarimasen",
              "tomodachijaarimasen",
              "tomodachidewanaidesu",
              "tomodachijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "ともだちでした"
            ],
            "kanji": [
              "友達でした"
            ],
            "romaji": [
              "tomodachideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "ともだちではありませんでした",
              "ともだちじゃありませんでした",
              "ともだちではなかったです",
              "ともだちじゃなかったです"
            ],
            "kanji": [
              "友達ではありませんでした",
              "友達じゃありませんでした",
              "友達ではなかったです",
              "友達じゃなかったです"
            ],
            "romaji": [
              "tomodachidewaarimasendeshita",
              "tomodachijaarimasendeshita",
              "tomodachidewanakattadesu",
              "tomodachijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "shizuka",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.shizuka",
    "registers": {
      "plain": {
        "japanese": "静かだ",
        "kana": "しずかだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "しずかだ"
            ],
            "kanji": [
              "静かだ"
            ],
            "romaji": [
              "shizukada"
            ]
          },
          "negative": {
            "kana": [
              "しずかじゃない",
              "しずかではない"
            ],
            "kanji": [
              "静かじゃない",
              "静かではない"
            ],
            "romaji": [
              "shizukajanai",
              "shizukadewanai"
            ]
          },
          "past": {
            "kana": [
              "しずかだった"
            ],
            "kanji": [
              "静かだった"
            ],
            "romaji": [
              "shizukadatta"
            ]
          },
          "negativePast": {
            "kana": [
              "しずかじゃなかった",
              "しずかではなかった"
            ],
            "kanji": [
              "静かじゃなかった",
              "静かではなかった"
            ],
            "romaji": [
              "shizukajanakatta",
              "shizukadewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "静かです",
        "kana": "しずかです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "しずかです"
            ],
            "kanji": [
              "静かです"
            ],
            "romaji": [
              "shizukadesu"
            ]
          },
          "negative": {
            "kana": [
              "しずかではありません",
              "しずかじゃありません",
              "しずかではないです",
              "しずかじゃないです"
            ],
            "kanji": [
              "静かではありません",
              "静かじゃありません",
              "静かではないです",
              "静かじゃないです"
            ],
            "romaji": [
              "shizukadewaarimasen",
              "shizukajaarimasen",
              "shizukadewanaidesu",
              "shizukajanaidesu"
            ]
          },
          "past": {
            "kana": [
              "しずかでした"
            ],
            "kanji": [
              "静かでした"
            ],
            "romaji": [
              "shizukadeshita"
            ]
          },
          "negativePast": {
            "kana": [
              "しずかではありませんでした",
              "しずかじゃありませんでした",
              "しずかではなかったです",
              "しずかじゃなかったです"
            ],
            "kanji": [
              "静かではありませんでした",
              "静かじゃありませんでした",
              "静かではなかったです",
              "静かじゃなかったです"
            ],
            "romaji": [
              "shizukadewaarimasendeshita",
              "shizukajaarimasendeshita",
              "shizukadewanakattadesu",
              "shizukajanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "genki",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.genki",
    "registers": {
      "plain": {
        "japanese": "元気だ",
        "kana": "げんきだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "げんきだ"
            ],
            "kanji": [
              "元気だ"
            ],
            "romaji": [
              "genkida"
            ]
          },
          "negative": {
            "kana": [
              "げんきじゃない",
              "げんきではない"
            ],
            "kanji": [
              "元気じゃない",
              "元気ではない"
            ],
            "romaji": [
              "genkijanai",
              "genkidewanai"
            ]
          },
          "past": {
            "kana": [
              "げんきだった"
            ],
            "kanji": [
              "元気だった"
            ],
            "romaji": [
              "genkidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "げんきじゃなかった",
              "げんきではなかった"
            ],
            "kanji": [
              "元気じゃなかった",
              "元気ではなかった"
            ],
            "romaji": [
              "genkijanakatta",
              "genkidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "元気です",
        "kana": "げんきです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "げんきです"
            ],
            "kanji": [
              "元気です"
            ],
            "romaji": [
              "genkidesu"
            ]
          },
          "negative": {
            "kana": [
              "げんきではありません",
              "げんきじゃありません",
              "げんきではないです",
              "げんきじゃないです"
            ],
            "kanji": [
              "元気ではありません",
              "元気じゃありません",
              "元気ではないです",
              "元気じゃないです"
            ],
            "romaji": [
              "genkidewaarimasen",
              "genkijaarimasen",
              "genkidewanaidesu",
              "genkijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "げんきでした"
            ],
            "kanji": [
              "元気でした"
            ],
            "romaji": [
              "genkideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "げんきではありませんでした",
              "げんきじゃありませんでした",
              "げんきではなかったです",
              "げんきじゃなかったです"
            ],
            "kanji": [
              "元気ではありませんでした",
              "元気じゃありませんでした",
              "元気ではなかったです",
              "元気じゃなかったです"
            ],
            "romaji": [
              "genkidewaarimasendeshita",
              "genkijaarimasendeshita",
              "genkidewanakattadesu",
              "genkijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "benri",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.benri",
    "registers": {
      "plain": {
        "japanese": "便利だ",
        "kana": "べんりだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "べんりだ"
            ],
            "kanji": [
              "便利だ"
            ],
            "romaji": [
              "benrida"
            ]
          },
          "negative": {
            "kana": [
              "べんりじゃない",
              "べんりではない"
            ],
            "kanji": [
              "便利じゃない",
              "便利ではない"
            ],
            "romaji": [
              "benrijanai",
              "benridewanai"
            ]
          },
          "past": {
            "kana": [
              "べんりだった"
            ],
            "kanji": [
              "便利だった"
            ],
            "romaji": [
              "benridatta"
            ]
          },
          "negativePast": {
            "kana": [
              "べんりじゃなかった",
              "べんりではなかった"
            ],
            "kanji": [
              "便利じゃなかった",
              "便利ではなかった"
            ],
            "romaji": [
              "benrijanakatta",
              "benridewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "便利です",
        "kana": "べんりです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "べんりです"
            ],
            "kanji": [
              "便利です"
            ],
            "romaji": [
              "benridesu"
            ]
          },
          "negative": {
            "kana": [
              "べんりではありません",
              "べんりじゃありません",
              "べんりではないです",
              "べんりじゃないです"
            ],
            "kanji": [
              "便利ではありません",
              "便利じゃありません",
              "便利ではないです",
              "便利じゃないです"
            ],
            "romaji": [
              "benridewaarimasen",
              "benrijaarimasen",
              "benridewanaidesu",
              "benrijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "べんりでした"
            ],
            "kanji": [
              "便利でした"
            ],
            "romaji": [
              "benrideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "べんりではありませんでした",
              "べんりじゃありませんでした",
              "べんりではなかったです",
              "べんりじゃなかったです"
            ],
            "kanji": [
              "便利ではありませんでした",
              "便利じゃありませんでした",
              "便利ではなかったです",
              "便利じゃなかったです"
            ],
            "romaji": [
              "benridewaarimasendeshita",
              "benrijaarimasendeshita",
              "benridewanakattadesu",
              "benrijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "kirei",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.kirei",
    "registers": {
      "plain": {
        "japanese": "きれいだ",
        "kana": "きれいだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "きれいだ"
            ],
            "kanji": [],
            "romaji": [
              "kireida"
            ]
          },
          "negative": {
            "kana": [
              "きれいじゃない",
              "きれいではない"
            ],
            "kanji": [],
            "romaji": [
              "kireijanai",
              "kireidewanai"
            ]
          },
          "past": {
            "kana": [
              "きれいだった"
            ],
            "kanji": [],
            "romaji": [
              "kireidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "きれいじゃなかった",
              "きれいではなかった"
            ],
            "kanji": [],
            "romaji": [
              "kireijanakatta",
              "kireidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "きれいです",
        "kana": "きれいです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "きれいです"
            ],
            "kanji": [],
            "romaji": [
              "kireidesu"
            ]
          },
          "negative": {
            "kana": [
              "きれいではありません",
              "きれいじゃありません",
              "きれいではないです",
              "きれいじゃないです"
            ],
            "kanji": [],
            "romaji": [
              "kireidewaarimasen",
              "kireijaarimasen",
              "kireidewanaidesu",
              "kireijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "きれいでした"
            ],
            "kanji": [],
            "romaji": [
              "kireideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "きれいではありませんでした",
              "きれいじゃありませんでした",
              "きれいではなかったです",
              "きれいじゃなかったです"
            ],
            "kanji": [],
            "romaji": [
              "kireidewaarimasendeshita",
              "kireijaarimasendeshita",
              "kireidewanakattadesu",
              "kireijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "yuumei",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.yuumei",
    "registers": {
      "plain": {
        "japanese": "有名だ",
        "kana": "ゆうめいだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "ゆうめいだ"
            ],
            "kanji": [
              "有名だ"
            ],
            "romaji": [
              "yuumeida"
            ]
          },
          "negative": {
            "kana": [
              "ゆうめいじゃない",
              "ゆうめいではない"
            ],
            "kanji": [
              "有名じゃない",
              "有名ではない"
            ],
            "romaji": [
              "yuumeijanai",
              "yuumeidewanai"
            ]
          },
          "past": {
            "kana": [
              "ゆうめいだった"
            ],
            "kanji": [
              "有名だった"
            ],
            "romaji": [
              "yuumeidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "ゆうめいじゃなかった",
              "ゆうめいではなかった"
            ],
            "kanji": [
              "有名じゃなかった",
              "有名ではなかった"
            ],
            "romaji": [
              "yuumeijanakatta",
              "yuumeidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "有名です",
        "kana": "ゆうめいです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "ゆうめいです"
            ],
            "kanji": [
              "有名です"
            ],
            "romaji": [
              "yuumeidesu"
            ]
          },
          "negative": {
            "kana": [
              "ゆうめいではありません",
              "ゆうめいじゃありません",
              "ゆうめいではないです",
              "ゆうめいじゃないです"
            ],
            "kanji": [
              "有名ではありません",
              "有名じゃありません",
              "有名ではないです",
              "有名じゃないです"
            ],
            "romaji": [
              "yuumeidewaarimasen",
              "yuumeijaarimasen",
              "yuumeidewanaidesu",
              "yuumeijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "ゆうめいでした"
            ],
            "kanji": [
              "有名でした"
            ],
            "romaji": [
              "yuumeideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "ゆうめいではありませんでした",
              "ゆうめいじゃありませんでした",
              "ゆうめいではなかったです",
              "ゆうめいじゃなかったです"
            ],
            "kanji": [
              "有名ではありませんでした",
              "有名じゃありませんでした",
              "有名ではなかったです",
              "有名じゃなかったです"
            ],
            "romaji": [
              "yuumeidewaarimasendeshita",
              "yuumeijaarimasendeshita",
              "yuumeidewanakattadesu",
              "yuumeijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "shinsetsu",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.shinsetsu",
    "registers": {
      "plain": {
        "japanese": "親切だ",
        "kana": "しんせつだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "しんせつだ"
            ],
            "kanji": [
              "親切だ"
            ],
            "romaji": [
              "shinsetsuda"
            ]
          },
          "negative": {
            "kana": [
              "しんせつじゃない",
              "しんせつではない"
            ],
            "kanji": [
              "親切じゃない",
              "親切ではない"
            ],
            "romaji": [
              "shinsetsujanai",
              "shinsetsudewanai"
            ]
          },
          "past": {
            "kana": [
              "しんせつだった"
            ],
            "kanji": [
              "親切だった"
            ],
            "romaji": [
              "shinsetsudatta"
            ]
          },
          "negativePast": {
            "kana": [
              "しんせつじゃなかった",
              "しんせつではなかった"
            ],
            "kanji": [
              "親切じゃなかった",
              "親切ではなかった"
            ],
            "romaji": [
              "shinsetsujanakatta",
              "shinsetsudewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "親切です",
        "kana": "しんせつです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "しんせつです"
            ],
            "kanji": [
              "親切です"
            ],
            "romaji": [
              "shinsetsudesu"
            ]
          },
          "negative": {
            "kana": [
              "しんせつではありません",
              "しんせつじゃありません",
              "しんせつではないです",
              "しんせつじゃないです"
            ],
            "kanji": [
              "親切ではありません",
              "親切じゃありません",
              "親切ではないです",
              "親切じゃないです"
            ],
            "romaji": [
              "shinsetsudewaarimasen",
              "shinsetsujaarimasen",
              "shinsetsudewanaidesu",
              "shinsetsujanaidesu"
            ]
          },
          "past": {
            "kana": [
              "しんせつでした"
            ],
            "kanji": [
              "親切でした"
            ],
            "romaji": [
              "shinsetsudeshita"
            ]
          },
          "negativePast": {
            "kana": [
              "しんせつではありませんでした",
              "しんせつじゃありませんでした",
              "しんせつではなかったです",
              "しんせつじゃなかったです"
            ],
            "kanji": [
              "親切ではありませんでした",
              "親切じゃありませんでした",
              "親切ではなかったです",
              "親切じゃなかったです"
            ],
            "romaji": [
              "shinsetsudewaarimasendeshita",
              "shinsetsujaarimasendeshita",
              "shinsetsudewanakattadesu",
              "shinsetsujanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "kantan",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.kantan",
    "registers": {
      "plain": {
        "japanese": "簡単だ",
        "kana": "かんたんだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "かんたんだ"
            ],
            "kanji": [
              "簡単だ"
            ],
            "romaji": [
              "kantanda"
            ]
          },
          "negative": {
            "kana": [
              "かんたんじゃない",
              "かんたんではない"
            ],
            "kanji": [
              "簡単じゃない",
              "簡単ではない"
            ],
            "romaji": [
              "kantanjanai",
              "kantandewanai"
            ]
          },
          "past": {
            "kana": [
              "かんたんだった"
            ],
            "kanji": [
              "簡単だった"
            ],
            "romaji": [
              "kantandatta"
            ]
          },
          "negativePast": {
            "kana": [
              "かんたんじゃなかった",
              "かんたんではなかった"
            ],
            "kanji": [
              "簡単じゃなかった",
              "簡単ではなかった"
            ],
            "romaji": [
              "kantanjanakatta",
              "kantandewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "簡単です",
        "kana": "かんたんです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "かんたんです"
            ],
            "kanji": [
              "簡単です"
            ],
            "romaji": [
              "kantandesu"
            ]
          },
          "negative": {
            "kana": [
              "かんたんではありません",
              "かんたんじゃありません",
              "かんたんではないです",
              "かんたんじゃないです"
            ],
            "kanji": [
              "簡単ではありません",
              "簡単じゃありません",
              "簡単ではないです",
              "簡単じゃないです"
            ],
            "romaji": [
              "kantandewaarimasen",
              "kantanjaarimasen",
              "kantandewanaidesu",
              "kantanjanaidesu"
            ]
          },
          "past": {
            "kana": [
              "かんたんでした"
            ],
            "kanji": [
              "簡単でした"
            ],
            "romaji": [
              "kantandeshita"
            ]
          },
          "negativePast": {
            "kana": [
              "かんたんではありませんでした",
              "かんたんじゃありませんでした",
              "かんたんではなかったです",
              "かんたんじゃなかったです"
            ],
            "kanji": [
              "簡単ではありませんでした",
              "簡単じゃありませんでした",
              "簡単ではなかったです",
              "簡単じゃなかったです"
            ],
            "romaji": [
              "kantandewaarimasendeshita",
              "kantanjaarimasendeshita",
              "kantandewanakattadesu",
              "kantanjanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "taisetsu",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.taisetsu",
    "registers": {
      "plain": {
        "japanese": "大切だ",
        "kana": "たいせつだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "たいせつだ"
            ],
            "kanji": [
              "大切だ"
            ],
            "romaji": [
              "taisetsuda"
            ]
          },
          "negative": {
            "kana": [
              "たいせつじゃない",
              "たいせつではない"
            ],
            "kanji": [
              "大切じゃない",
              "大切ではない"
            ],
            "romaji": [
              "taisetsujanai",
              "taisetsudewanai"
            ]
          },
          "past": {
            "kana": [
              "たいせつだった"
            ],
            "kanji": [
              "大切だった"
            ],
            "romaji": [
              "taisetsudatta"
            ]
          },
          "negativePast": {
            "kana": [
              "たいせつじゃなかった",
              "たいせつではなかった"
            ],
            "kanji": [
              "大切じゃなかった",
              "大切ではなかった"
            ],
            "romaji": [
              "taisetsujanakatta",
              "taisetsudewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "大切です",
        "kana": "たいせつです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "たいせつです"
            ],
            "kanji": [
              "大切です"
            ],
            "romaji": [
              "taisetsudesu"
            ]
          },
          "negative": {
            "kana": [
              "たいせつではありません",
              "たいせつじゃありません",
              "たいせつではないです",
              "たいせつじゃないです"
            ],
            "kanji": [
              "大切ではありません",
              "大切じゃありません",
              "大切ではないです",
              "大切じゃないです"
            ],
            "romaji": [
              "taisetsudewaarimasen",
              "taisetsujaarimasen",
              "taisetsudewanaidesu",
              "taisetsujanaidesu"
            ]
          },
          "past": {
            "kana": [
              "たいせつでした"
            ],
            "kanji": [
              "大切でした"
            ],
            "romaji": [
              "taisetsudeshita"
            ]
          },
          "negativePast": {
            "kana": [
              "たいせつではありませんでした",
              "たいせつじゃありませんでした",
              "たいせつではなかったです",
              "たいせつじゃなかったです"
            ],
            "kanji": [
              "大切ではありませんでした",
              "大切じゃありませんでした",
              "大切ではなかったです",
              "大切じゃなかったです"
            ],
            "romaji": [
              "taisetsudewaarimasendeshita",
              "taisetsujaarimasendeshita",
              "taisetsudewanakattadesu",
              "taisetsujanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "suki",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.suki",
    "registers": {
      "plain": {
        "japanese": "好きだ",
        "kana": "すきだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "すきだ"
            ],
            "kanji": [
              "好きだ"
            ],
            "romaji": [
              "sukida"
            ]
          },
          "negative": {
            "kana": [
              "すきじゃない",
              "すきではない"
            ],
            "kanji": [
              "好きじゃない",
              "好きではない"
            ],
            "romaji": [
              "sukijanai",
              "sukidewanai"
            ]
          },
          "past": {
            "kana": [
              "すきだった"
            ],
            "kanji": [
              "好きだった"
            ],
            "romaji": [
              "sukidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "すきじゃなかった",
              "すきではなかった"
            ],
            "kanji": [
              "好きじゃなかった",
              "好きではなかった"
            ],
            "romaji": [
              "sukijanakatta",
              "sukidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "好きです",
        "kana": "すきです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "すきです"
            ],
            "kanji": [
              "好きです"
            ],
            "romaji": [
              "sukidesu"
            ]
          },
          "negative": {
            "kana": [
              "すきではありません",
              "すきじゃありません",
              "すきではないです",
              "すきじゃないです"
            ],
            "kanji": [
              "好きではありません",
              "好きじゃありません",
              "好きではないです",
              "好きじゃないです"
            ],
            "romaji": [
              "sukidewaarimasen",
              "sukijaarimasen",
              "sukidewanaidesu",
              "sukijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "すきでした"
            ],
            "kanji": [
              "好きでした"
            ],
            "romaji": [
              "sukideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "すきではありませんでした",
              "すきじゃありませんでした",
              "すきではなかったです",
              "すきじゃなかったです"
            ],
            "kanji": [
              "好きではありませんでした",
              "好きじゃありませんでした",
              "好きではなかったです",
              "好きじゃなかったです"
            ],
            "romaji": [
              "sukidewaarimasendeshita",
              "sukijaarimasendeshita",
              "sukidewanakattadesu",
              "sukijanakattadesu"
            ]
          }
        }
      }
    }
  },
  {
    "id": "kirai",
    "type": "na-predicate",
    "meaningKey": "conjugations.word.kirai",
    "registers": {
      "plain": {
        "japanese": "嫌いだ",
        "kana": "きらいだ",
        "conjugations": {
          "affirmative": {
            "kana": [
              "きらいだ"
            ],
            "kanji": [
              "嫌いだ"
            ],
            "romaji": [
              "kiraida"
            ]
          },
          "negative": {
            "kana": [
              "きらいじゃない",
              "きらいではない"
            ],
            "kanji": [
              "嫌いじゃない",
              "嫌いではない"
            ],
            "romaji": [
              "kiraijanai",
              "kiraidewanai"
            ]
          },
          "past": {
            "kana": [
              "きらいだった"
            ],
            "kanji": [
              "嫌いだった"
            ],
            "romaji": [
              "kiraidatta"
            ]
          },
          "negativePast": {
            "kana": [
              "きらいじゃなかった",
              "きらいではなかった"
            ],
            "kanji": [
              "嫌いじゃなかった",
              "嫌いではなかった"
            ],
            "romaji": [
              "kiraijanakatta",
              "kiraidewanakatta"
            ]
          }
        }
      },
      "polite": {
        "japanese": "嫌いです",
        "kana": "きらいです",
        "conjugations": {
          "affirmative": {
            "kana": [
              "きらいです"
            ],
            "kanji": [
              "嫌いです"
            ],
            "romaji": [
              "kiraidesu"
            ]
          },
          "negative": {
            "kana": [
              "きらいではありません",
              "きらいじゃありません",
              "きらいではないです",
              "きらいじゃないです"
            ],
            "kanji": [
              "嫌いではありません",
              "嫌いじゃありません",
              "嫌いではないです",
              "嫌いじゃないです"
            ],
            "romaji": [
              "kiraidewaarimasen",
              "kiraijaarimasen",
              "kiraidewanaidesu",
              "kiraijanaidesu"
            ]
          },
          "past": {
            "kana": [
              "きらいでした"
            ],
            "kanji": [
              "嫌いでした"
            ],
            "romaji": [
              "kiraideshita"
            ]
          },
          "negativePast": {
            "kana": [
              "きらいではありませんでした",
              "きらいじゃありませんでした",
              "きらいではなかったです",
              "きらいじゃなかったです"
            ],
            "kanji": [
              "嫌いではありませんでした",
              "嫌いじゃありませんでした",
              "嫌いではなかったです",
              "嫌いじゃなかったです"
            ],
            "romaji": [
              "kiraidewaarimasendeshita",
              "kiraijaarimasendeshita",
              "kiraidewanakattadesu",
              "kiraijanakattadesu"
            ]
          }
        }
      }
    }
  }
];
