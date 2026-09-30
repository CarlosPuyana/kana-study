# Deck scheduler

The Decks module uses `ts-fsrs` directly through `DeckSchedulerService`. It is intentionally separate from the round-based learning services used by Kana, Flags, Kanji, and Vocabulary.

## Ratings and states

The UI exposes two ratings: **Again** maps to `Rating.Again`, and **Good** maps to `Rating.Good`. `Hard` and `Easy` are not used. Every submitted rating, including same-day Learning and Relearning steps, creates a real FSRS transition and review event.

Cards use the library states `New`, `Learning`, `Review`, and `Relearning`. Static deck content never contains scheduling fields. A `DeckCardProgress` record is created only after the first rating.

## FSRS configuration

The desired retention comes from the deck settings at the time of each review. Changing it does not rewrite existing due dates. The scheduler enables short-term scheduling and fuzz, uses learning steps `1m, 10m`, a relearning step of `10m`, a maximum interval of 36,500 days, and the library's default weights.

The answer preview is generated once with `repeat()`. The selected branch is persisted directly, so fuzz cannot make the displayed and stored interval disagree. Review events keep the complete serialized library log and retrievability before the answer for later calibration.

## Daily queue

The local browser calendar day controls the new-card allowance. A new entry counts as introduced only after its first rating. The effective limit is the persistent `newCardsPerDay` setting unless the current `DeckDailyState` has an override. Home's plus and minus buttons change that override in steps of five and never change the persistent setting.

Due Learning and Relearning cards always come first, ordered by due time. Due Review cards are ordered by the lowest FSRS retrievability, with oldest due time as a fallback. New cards follow deck order. The before/after setting places new cards around reviews; mixed mode uses a deterministic accumulator to spread them through the session. Future Review and Learning cards are never pulled forward.

## Persistence and undo

IndexedDB database `kana-study-decks`, version 1, has three stores:

- `card-progress`, keyed by `[deckId, entryId]`, with `deckId`, `due`, and `state` indexes.
- `review-events`, keyed by event ID, with `deckId`, `entryId`, `reviewedAt`, and `[deckId, reviewedAt]` indexes.
- `daily-state`, keyed by `[deckId, localDate]`.

A rating writes progress, its review event, and daily state in one transaction. The last rating in the current session can be undone in one transaction. Undo restores the previous card snapshot or removes progress for a first-time New card, deletes the review event, and removes the daily introduction when applicable.

Dates in persisted FSRS cards and logs are millisecond timestamps. Conversion to and from `Date` is centralized in `deck-study-serialization.ts`.
