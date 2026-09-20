# Manual accessibility test checklist

Automatic audits (axe, Lighthouse, `scripts/check-site.mjs`, `scripts/check-contrast.mjs`) and the keyboard checks in the release notes cannot replace a person who uses a screen reader every day. This list is meant for a blind or low-vision tester. **Real screen-reader testing has not been done yet.**

Test on: (1) NVDA or JAWS with Firefox/Chrome on Windows, (2) VoiceOver with Safari on macOS or iOS, (3) TalkBack with Chrome on Android. Language pages: `/tr/` and `/en/`.

Please note for every item: pass / fail / comment, plus device, browser and screen reader with version.

## Whole site
- [ ] "Skip to main content" is the first thing reached with Tab and moves you to the content.
- [ ] Landmarks (banner, navigation, main, contentinfo) are announced; the navigation has a name.
- [ ] Every page has one level-1 heading, and the page title changes when you move between pages.
- [ ] Links and buttons have clear names (no "click here"); nothing is announced as "unlabelled".
- [ ] The language of the page is announced correctly (Turkish text is read with a Turkish voice).
- [ ] Settings → text size, line spacing, dyslexia option and paper mode all apply and are announced as saved.

## Reading a lesson
- [ ] The lesson page reads in a logical order without JavaScript features (try with the reader turned to *scroll* view).
- [ ] Card view: "Next card" moves focus to the new card's heading and the heading says "Card n of N".
- [ ] The progress bar has a spoken value; "Contents" opens a dialog, ESC closes it and focus comes back to the button.
- [ ] Deep-dive cards can be opened and closed; their state is announced.
- [ ] Person and concept references open a panel: focus moves into it, ESC closes it, focus returns to the link. "Open the full page" works.
- [ ] Citations ([1]) are announced as "Reference 1" and jump to the reference list.

## Questions
- [ ] Multiple choice, true/false: the radio group has the question as its name; choices can be selected with arrow keys.
- [ ] Matching: every left item has a select; "Choose…" is announced.
- [ ] Ordering: the up/down buttons say which item they move; after a move the new position is announced; focus stays on the moved item.
- [ ] Fill in the blanks: each blank says "Blank n" and lists its options.
- [ ] Short case: parts appear one after another and are announced.
- [ ] After "Check answer" the result (correct / not quite / partly correct) and the explanation are read; the correct answer is stated in words.
- [ ] Nothing depends on colour: right and wrong are spoken and written.

## Study space
- [ ] Study, Statistics, Review, Exams pages are usable by keyboard only.
- [ ] Every chart has a table and a text summary; tables have captions and header cells.
- [ ] Timed exam: the "How much time is left?" button announces the time; automatic warnings at 5 min, 1 min and 30 s are heard; time-up is announced.
- [ ] Badges and level-ups are announced politely (not interrupting typing).

## Low vision and motor
- [ ] 200% browser zoom and 175% in-app text size: no horizontal scrolling on a phone, nothing cut off.
- [ ] High contrast, sepia and paper themes are legible; the focus ring is always visible.
- [ ] All targets are easy to hit (44 px) with a touch screen and with switch/keyboard access.
- [ ] Reduced motion: no animation with the OS setting on.
