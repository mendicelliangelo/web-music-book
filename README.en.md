# 🎼 Quaderno di musica (Music notebook)

**A sheet-music editor that lives in a web page.**
Write notes on the staff (with mouse, touch, computer keyboard, a MIDI piano, or even by humming into a microphone), hear them instantly through a built-in synthesizer, and take your work away as **MIDI**, **PDF**, an **image**, **WAV audio**, or a **JSON project**. You can also load a MIDI or MusicXML file back in and keep editing it, train your ear with a small listening game, and work in **Italian, English, French, Spanish, German or Polish**.

On opening, a title screen appears for a couple of seconds, then the editor opens: two side panels (settings and note palette on the right, transforms and files on the left) around the score and keyboard, with a fixed playback bar at the bottom.

> The interface ships in Italian but the language switcher in the top bar translates the whole UI live into English, French, Spanish, German or Polish — your choice is remembered for next time.

The whole application runs in the browser: no installation, no server, no account. Your data stays in your browser (`localStorage`); the only things that leave it are the files you choose to download or the link you choose to share.

---

## Contents

1. [Overview](#overview)
2. [Score settings](#score-settings)
3. [Writing notes](#writing-notes)
4. [Markings, text and harmony](#markings-text-and-harmony)
5. [Autocomplete and variations](#autocomplete-and-variations)
6. [The on-screen piano](#the-on-screen-piano)
7. [Recording: keyboard, MIDI, microphone](#recording-keyboard-midi-microphone)
8. [Selecting and editing](#selecting-and-editing)
9. [Transforming the score](#transforming-the-score)
10. [Playback and mixer](#playback-and-mixer)
11. [Ear training](#ear-training)
12. [Files: save, download, load, share](#files-save-download-load-share)
13. [Language and theme](#language-and-theme)
14. [Phone layout](#phone-layout)
15. [Keyboard shortcuts](#keyboard-shortcuts)
16. [Under the hood](#under-the-hood)
17. [Known limitations](#known-limitations)

---

## Overview

| What you can do | How |
|---|---|
| Write a score on **one or two staves** | Click the staff, keys `A`–`G`, on-screen piano, PC keyboard, MIDI keyboard |
| Choose **tempo, time signature, key signature, clef and instrument** | Settings panel (right) |
| **Listen**, with a **mixer** per staff | *Play* button, settings panel |
| **Record** by playing, or by **humming** | *Record* and *Record from microphone* buttons |
| **Fix** notes, durations, accidentals | Selection, pop-up menu, undo/redo |
| **Add** pedal, fermata, trill, mordent, hairpins, rehearsal letters, lyrics and chord symbols | Left panel, *Marks on notes* and *Text and chords* groups |
| **Generate** scales, arpeggios, Alberti basses and variations | Left panel, *Autocomplete* and *Generate a variation* |
| **Transpose, quantize, scale, search and replace** | Left panel, *Transform* section |
| **Train your ear** on intervals and chords | Right panel, *Ear training* |
| **Export** | MIDI (ZIP), A4 PDF, PNG image, WAV audio, shareable link, JSON project |
| **Import** | MIDI file, ZIP with MIDI, MusicXML, JSON project (drag it onto the score too) |
| **Work** in 6 languages, with a light/dark/system theme | Selectors in the top bar |

---

## Score settings

In the right-hand panel, *Settings* section:

- **Title**: shown above the score; also appears in the PDF and MIDI.
- **Key signature**: 15 key signatures, from 7 flats to 7 sharps.
- **Time signature**: 2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8, 5/4.
- **Staves**: one, or two (a grand staff for piano, with a brace).
- **Clef**, per staff, among the seven historical clefs (treble, the four C clefs, baritone and bass).
- **Tempo**: 30–240 beats per minute, with a slider, a number field and the tempo term (Adagio, Andante, Allegro…).
- **Instrument**: Piano, Electric piano, Organ, Violin, Clarinet, Flute. If the chosen instrument is a transposing one, a note appears: the PDF is written in the key that instrument reads.
- **Measure numbers**: on every line, every N lines, or none.
- **Zoom** of the score (next to the title) and **colours**: note names on noteheads, one colour per note, or one colour per staff.
- **Handwritten style**: title, lyrics and chord symbols in a cursive handwriting font, for a more "notebook" feel.

---

## Writing notes

The score has a **caret** (the coloured bar) showing where the next note will go.

**Durations**: whole 1/1, **half 1/2**, quarter 1/4, eighth 1/8, sixteenth 1/16, thirty-second 1/32.

**Note modifiers**:

- **Dot (+½)**: adds half of the note's value.
- **Sharp ♯ / Flat ♭ / Natural ♮**: accidental for the next note.
- **Rest**: inserts a rest of the chosen duration.
- **Chord** (in the note palette, right panel): new notes stack onto the previous one instead of moving forward.
- **Tie**: ties the note to the next one if it has the same pitch.
- **Overwrite**: new notes replace existing ones instead of pushing them forward.
- **Delete**: removes the selected note or the one before the caret.
- **Repeat measure**: duplicates the selection, or the last measure if nothing is selected.

**Helpful automatic behaviour**: notes crossing a bar line are split and tied automatically; nearby notes are joined with beams; notes outside the staff get ledger lines; you can click on the staff to insert a note at that pitch (hold `Shift` for a chord).

---

## Markings, text and harmony

In the left panel, besides the classic dynamics (**pp, p, mp, mf, f, ff**, staccato, accent, phrase slur):

- **Pedal**: a sustain-pedal mark from the first to the last selected note.
- **Fermata**: lengthens the note, in playback only.
- **Trill** and **Mordent**: the sign only, on the score — they don't change the sound played back.
- **Crescendo** and **Diminuendo**: hairpins from the first to the last selected note.
- **Rehearsal letter**: a letter (A, B, …) above the chosen note, handy for marking sections of the piece.
- **Lyrics under the note**.
- **Chord symbol above the note**: type it yourself (e.g. *G7*) or press **Analyze chords** to have it detected automatically, measure by measure, from the written notes (on the whole staff or just the selection).
- **Clear marks**: removes dynamics, staccato, accent and phrase slurs from the selection.

---

## Autocomplete and variations

Also in the left panel:

- **Autocomplete**: generates, starting at the caret, a **scale**, an **arpeggio** or an **Alberti bass** in the current mode (major/minor) and key, at the duration set in the note palette.
- **Generate a variation**, on the whole staff or the selection: **mirrored** (inverts the direction of the intervals), **in minor mode** (rewrites the melody in the relative minor), or **retrograde** (plays it backwards).
- **Search and replace**: replaces every occurrence of a note (by scale degree, e.g. "every F") with another, on the whole staff or the selection.

---

## The on-screen piano

Below the score there's a scrollable piano keyboard.

- **Tap/click a key** → it sounds and writes the note at the chosen duration (unless recording is active, see below).
- **Key labels**: *Do Re Mi*, *C D E*, or none.
- **Octave** up/down with the − and + buttons.
- **⌫ Delete**: removes the last note written, or the selected one.
- **Quantize to**: the grid used by *Record* and *Duration from the hold*.
- **Duration from the hold**: the note's length is decided by how long you hold the key.
- **PC keyboard**: your computer's letter keys play the piano, with two layouts (two octaves on Z–M/Q–U, or middle C on H).
- **Metronome**, with an optional **accelerando** each loop (the *Speed up each loop* checkbox).

---

## Recording: keyboard, MIDI, microphone

1. **Record**: a metronome count-in starts, then whatever you play on the on-screen piano, the PC keyboard or a connected MIDI keyboard is written on the active staff at the chosen tempo; on stop, durations are quantized and gaps become written rests.
2. **Connect MIDI keyboard**: until *Record* or *Duration from the hold* is active, every note (or chord) you play on the MIDI keyboard is written straight at the caret with the duration set in the palette, and the caret moves on by itself — **step-time entry**, handy for transcribing quickly.
3. **Record from microphone**: hum or play near the microphone; pitch is recognized by **autocorrelation of the audio signal**, entirely in the browser (no external library, nothing leaves the browser); detected notes are written on the active staff.

---

## Selecting and editing

- **Click a note** to select it; **Shift + click** or **Shift + arrows** for a range.
- **Pop-up menu** on the selected note (on a phone it opens from the bottom): duration, dot, accidentals, rest, marks, delete.
- **↑ / ↓** move the selected note by one step (with Shift, by an octave); **← / →** move the caret or the selection.
- **Select all, Copy, Cut, Paste, Repeat measure**.
- **Undo / Redo**: edit history.
- **New score** starts from scratch (or from a **template**, see [Files](#files-save-download-load-share)).

---

## Transforming the score

All these functions work on the whole active staff, or only on the **selection**.

| Function | What it does |
|---|---|
| **Transpose** | − / + octave, tone, semitone, with accidentals rewritten correctly. |
| **Quantize** | Aligns the start and end of every note to a grid (1/1 … 1/32); notes shorter than the grid are removed with a notice, total length is preserved. |
| **Scale durations** | Doubles (×2) or halves (÷2) every note. |
| **Autocomplete / Variation / Search and replace** | See [Autocomplete and variations](#autocomplete-and-variations). |

---

## Playback and mixer

- The **Play** button (always reachable at the bottom) starts and stops playback; the space bar does the same.
- Sound is generated in the browser with **WebAudio**: additive synthesis with an envelope, vibrato for violin and flute.
- In the settings panel: **playback rate** (50–100%), **loop the selection**, **swing**, **reverb**, **stereo per staff** (one channel left, the other right), and, for each staff, **solo / mute / volume**.
- It plays chords, rests, ties, dynamics, hairpins, pedal, fermata, staccato and accents, on one or two staves together.
- The total duration is always visible next to the Play button.

---

## Ear training

A small game in the right panel:

- Choose the exercise type — **intervals** or **chords**.
- **New** plays a random interval or chord; pick the answer among the buttons shown.
- **Replay** repeats the last sound without changing it.
- Your score of correct answers stays visible below the exercise.

---

## Files: save, download, load, share

| Button | Result |
|---|---|
| **Download MIDI** | A standard MIDI file (format 1, 480 PPQ), inside a ZIP (the viewer doesn't allow a direct `.mid` download): extract it to use elsewhere, or load the ZIP back in as it is. |
| **Download PDF** | A printable A4 page with title, measure numbers, dynamics, lyrics and chord symbols; if the instrument transposes, the PDF is written in the key it reads. |
| **Export image** | A PNG of the whole score, or just the selection if there is one. |
| **Export audio (WAV)** | The same sound as on-page playback, including reverb, rendered offline and downloaded as a `.wav` file. |
| **Copy shareable link** | Copies a URL with the whole piece, compressed, encoded inside the link itself: whoever opens it sees the score right away, no server or file to pass around. |
| **Save project** | A JSON file with the whole score: the most faithful way to resume work. |
| **Load MIDI** | Opens a `.mid`, a `.zip` containing one, a **MusicXML** file (`.xml`/`.musicxml`) or a `.json` project; you can also drag the file onto the score. |
| **New score** / **New from template** | Starts over, or from one of the ready-made templates (two-staff piano, voice and piano, solo instrument). |
| **Save version / Restore version / Delete version** | **Named** snapshots of the piece, stored in the browser: handy for keeping several variants of the same piece, on top of the regular Undo/Redo. |

---

## Language and theme

- **Language** (top-right selector): Italian, English, French, Spanish, German, Polish. Switches the whole interface live — labels, buttons, tooltips, messages and shortcuts — and is remembered for next time.
- **Theme** (selector next to it): light, dark, or following the system setting.

---

## Phone layout

Below 760 px of width the interface changes:

- the **score stays pinned at the top** (limited height, it scrolls on its own) while the keyboard and note palette scroll below;
- the two side panels become **sliding drawers**: one slides in from the **left** (edit and files), the other from the **right** (settings and note palette), opened by the two buttons in the bottom bar;
- a **fixed footer** keeps Play, Undo, Redo, the piece's duration and the two panel buttons within thumb's reach;
- keys and buttons have large touch targets; the pop-up menu for the selected note becomes a bottom sheet;
- it respects iPhone safe areas (notch and bottom bar).

---

## Keyboard shortcuts

Letters `A`–`G` always write notes; the shortcuts below are **customizable** (right panel, *Keyboard shortcuts*): click the key shown, then press the new one on your keyboard (`Esc` to cancel); **Reset to defaults** brings them back to this table.

| Key (default) | Action |
|---|---|
| `Shift` + letter | Add the note as a chord |
| `1` … `6` | Duration: whole … thirty-second |
| `.` | Dot |
| `+` / `-` / `=` | Sharp / flat / natural |
| `R` | Rest |
| `T` | Tie |
| `L` | Phrase slur |
| `S` | Staccato |
| `>` | Accent |
| `O` | Overwrite on/off |
| `Backspace` / `Delete` | Delete backward / forward |
| `←` `→` | Move the caret (with `Shift`, extend the selection) |
| `↑` `↓` | Move the selected note (with no selection: switch staff) |
| `Home` / `End` | Start / end of the staff |
| `Esc` | Deselect |
| `Space` | Play / stop |
| `Ctrl + A / C / X / V` | Select all / copy / cut / paste |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Undo / redo |

---

## Under the hood

- **Files split by logic, no build step**: `Quadernodimusica.html` is just the shell (title screen, two side panels, score, keyboard, playback bar); styles live in `css/` (tokens and theme, two-column layout, components, phone adaptation) and JavaScript in `js/`, one file per topic, loaded in order: music glyphs, music model, measures and ties, MIDI reading/writing, ZIP archive, transforms, SVG layout and rendering, PDF writer, translations (`00-i18n.js`), application state, audio, UI rendering, write/transform actions, keyboard/MIDI/microphone input, pointer input, files, phone layout, title screen, bootstrap.
- **Translations**: a single dictionary (`js/00-i18n.js`) with one entry per language; static markup uses `data-i18n`/`data-i18n-title`/`data-i18n-ph`/`data-i18n-aria`/`data-i18n-html` attributes, generated text goes through the `t(key, vars)` function.
- **Data model**: each staff is `{clef, events}`; a note is `{v, dot, n:[{d, a, t}]}` with `d` a diatonic number and `a` the accidental; a rest is `{r:true, v, dot}`. Resolution is **480 PPQ**.
- **Rendering**: the score is an SVG computed by a dedicated layout engine (positions, beams, ledger lines, slurs); the same layout feeds the PDF and the image export.
- **Audio**: WebAudio for synthesis, reverb and offline WAV export; Web MIDI for the external keyboard; `getUserMedia` + autocorrelation for microphone pitch detection.
- **Archives**: *stored* (uncompressed) ZIP reading and writing implemented by hand, with CRC-32.
- **Sharing**: the piece is serialized to JSON, compressed and base64-encoded inside the link (`#share=...`), with no server involved.

---

## Known limitations

- The **sound** is synthesized: pleasant, but not sampled real instruments.
- The **MIDI keyboard** needs a browser with Web MIDI (Chrome, Edge) and the user's permission; some embedded environments block it.
- **Microphone recognition** works best with a clean, isolated sound (voice or a monophonic instrument); chords and background noise can confuse it.
- The **MIDI download** arrives as a ZIP because of the viewer's restrictions.
- The `;` `'` `[` keys of the *middle C on H* layout depend on the physical keyboard: on layouts other than Italian/English they may sit elsewhere.
- Importing very complex MIDI or MusicXML (multiple voices, triplets, tempo changes) simplifies the score to the chosen grid.
- One tempo and one time signature for the whole piece (no mid-piece changes).
- The **shareable link** can get very long for long pieces: some messaging apps truncate it.

---

*Quaderno di musica — write, listen, export.*
