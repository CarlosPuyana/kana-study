# RUSH

RUSH is an endless practice mode for Kana, Kanji, and Vocabulary. It never calls the normal progress, review-event, round, or FSRS services.

## Flow

Each module converts its independent RUSH configuration into generic `RushUnit` values. `RushEngine` traverses a Fisher–Yates shuffle bag, keeps every unit exactly once per cycle, and swaps adjacent entries when another `contentId` can separate them. Finishing a bag starts another one immediately.

A card counts only after reveal followed by Next. Sessions store aggregate counts and accumulated coverage, without a per-card event history.

## Time

`RushActiveTimer` accumulates timestamp deltas while the document is visible and there has been relevant activity within three minutes. Background time never counts, and returning to the tab requires a new interaction before timing resumes.

## Storage

Settings use independent `localStorage` keys for each module. Session and coverage data use IndexedDB `kana-study-rush`, version 1, with `sessions` and `coverage` stores. The normal FSRS stores and the Decks database are not read or written.

## Medals

The 15 global RUSH medals use the existing medal presentation model with separate definitions, evaluation, and unlock persistence. Coverage uses stable Kana IDs, Kanji IDs, and Vocabulary entry IDs.
