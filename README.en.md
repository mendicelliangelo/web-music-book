# 🎼 Quaderno di musica

**A sheet-music editor that lives in a single web page.**
Write notes on the staff (with mouse, touch, computer keyboard or a MIDI piano), hear them instantly through a built-in synthesizer, and take your work away as **MIDI**, **PDF** or a **JSON project**. You can also load a MIDI file back in and keep editing it.

The whole application is one HTML file: no installation, no server, no account. Your data stays in your browser; the only things that leave it are the files you choose to download.

> The interface is in Italian. Button names are given in English below, with the Italian label in *italics* where it helps.

---

## Contents

1. [Overview](#overview)
2. [Score settings](#score-settings)
3. [Writing notes](#writing-notes)
4. [The on-screen piano](#the-on-screen-piano)
5. [Recording as you play](#recording-as-you-play)
6. [Selecting and editing](#selecting-and-editing)
7. [Transforming the score](#transforming-the-score)
8. [Playback](#playback)
9. [Files: save, download, load](#files-save-download-load)
10. [Phone layout](#phone-layout)
11. [Keyboard shortcuts](#keyboard-shortcuts)
12. [Under the hood](#under-the-hood)
13. [Known limitations](#known-limitations)

---

## Overview

| What you can do | How |
|---|---|
| Write a score on **one or two staves** | Click the staff, keys `A`–`G`, on-screen piano, PC keyboard, MIDI keyboard |
| Choose **tempo, time signature, key signature and clef** | Settings panel |
| **Listen** to the piece | *Play* button (in-browser synthesizer, 6 instruments) |
| **Record** by playing in real time | *Record* button, with a metronome count-in |
| **Fix** notes, durations, accidentals | Selection, pop-up menu, undo/redo |
| **Transpose, quantize, scale** durations | *Modifica* (edit) section |
| **Export** | MIDI (inside a ZIP file), printable A4 PDF, JSON project |
| **Import** | MIDI file, ZIP containing MIDI, JSON project (you can also drag it onto the score) |

---

## Score settings

- **Title**: shown above the score; it also appears in the PDF and the MIDI file.
- **Key signature**: 15 key signatures, from 7 flats to 7 sharps (C major / A minor, G major / E minor, F major / D minor, …). The key signature's accidentals are applied automatically to the notes you write.
- **Time signature**: 2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8, 5/4. Bar lines follow accordingly.
- **Staves**: one, or two (a **grand staff for piano**, with a brace).
- **Clef**, for each staff, among the seven historical clefs:
  Treble (G), Soprano, Mezzo-soprano, Alto, Tenor (the four C clefs), Baritone and Bass (F clefs).
- **Tempo**: 30 to 240 beats per minute, with a slider and a number field; the tempo term (Adagio, Andante, Allegro…) is shown next to it.
- **Instrument**: Piano, Electric piano, Organ, Violin, Clarinet, Flute. The chosen instrument is written into the MIDI file as a General MIDI program.

---

## Writing notes

The score has a **caret** (the green bar) showing where the next note will go.

**Durations** (buttons showing the note shape): whole 1/1, **half 1/2**, quarter 1/4, eighth 1/8, sixteenth 1/16, thirty-second 1/32.

**Note modifiers** (the *Modifiche* buttons):

- **Dot (+½)**: adds half of the note's value.
- **Sharp ♯ / Flat ♭ / Natural ♮**: accidental for the next note.
- **Rest** (*Pausa*): inserts a rest of the chosen duration.
- **Chord** (*Accordo*): new notes stack onto the previous one instead of moving forward.
- **Tie** (*Legatura*): ties the note to the next one if it has the same pitch.
- **Overwrite** (*Sovrascrivi*): new notes replace existing ones instead of pushing them forward.
- **Delete** (*Elimina*): removes the selected note or the one before the caret.

**Helpful automatic behaviour**

- When a note crosses a **bar line**, it is **split and tied** automatically.
- Nearby notes are **joined with beams**, as on printed music.
- Notes outside the staff get **ledger lines**.
- You can also **click on the staff** to insert a note at that pitch (hold `Shift` to add it as a chord).

**Dynamics and markings**

- Dynamics *from the note onward*: **pp, p, mp, mf, f, ff** (they change playback volume and appear on the score and in the PDF).
- **Staccato** (the note lasts half as long), **Accent** (plays louder).
- **Phrase slur** (arc) over several selected notes.
- **Clear marks** (*Togli segni*): removes dynamics, staccato, accent and phrase slurs.

---

## The on-screen piano

Below the score there is a scrollable piano keyboard.

- **Tap/click a key** → it sounds and writes the note at the chosen duration.
- **Key labels**: *Do Re Mi*, *C D E* or none.
- **Octave** up/down with the − and + buttons.
- **⌫ Cancella (Delete)**: removes the last note written (or the selected one), like the Backspace key.
- **Quantize to** (*quantizza a*): the grid (whole note down to thirty-second) used by *Record* and by *Duration from touch*.
- **Duration from touch** (*Durata dal tocco*): **the note length is decided by how long you hold the key**. While you hold, the computed duration is shown; on release the note is written with the nearest note value.
- **PC keyboard** (*Tastiera del PC*): your computer's letter keys play the piano. The keys to press are printed on the piano keys. Two layouts:
  - *Z–M and Q–U (two octaves)*: lower row `Z X C V B N M` (with black keys `S D G H J`) and upper row `Q W E R T Y U I` (with black keys `2 3 5 6 7`).
  - *Middle C on H*: middle C is `H`; the white keys are the row `A S D F G H J K L ; '` and the black keys the row above (`E R T · U I · P [`).
- **Connect MIDI keyboard**: use a real MIDI keyboard through Web MIDI (see [Known limitations](#known-limitations)).
- **Metronome**: a click at the chosen tempo to keep time.

---

## Recording as you play

1. Choose tempo and time signature, then press **Record**.
2. A **metronome count-in** starts to give you your cue.
3. Play on the on-screen piano, the PC keyboard or a MIDI keyboard: notes are written on the active staff, **following the tempo you chose**.
4. Stop recording: durations are **quantized** to the chosen grid (default sixteenth) and gaps between notes become written rests.

---

## Selecting and editing

- **Click a note** to select it; **Shift + click** or **Shift + arrows** to select a range.
- **Pop-up menu** on the selected note (on a phone it opens from the bottom): all the useful operations in one place — duration, dot, accidentals, rest, markings, delete.
- **↑ / ↓** move the selected note by one step (with Shift, by an octave); **← / →** move the caret or the selection.
- **Select all, Copy, Cut, Paste**: work on the active staff.
- **Undo / Redo**: edit history.
- **New score** starts from scratch.

---

## Transforming the score

All these functions work on the whole active staff or only on the **selection**.

| Function | What it does |
|---|---|
| **Transpose** | − / + octave, tone, semitone. Accidentals are rewritten correctly. |
| **Quantize** | Aligns the start and end of every note to a grid (1/1 … 1/32). Notes shorter than the grid are removed and a notice says so; the total length of the piece is preserved. |
| **Scale durations** | **Double (×2)** or **Halve (÷2)**: a half note becomes a whole note, or a quarter note. |

---

## Playback

- The **Play** button (*Ascolta*, always reachable at the bottom) starts and stops playback; the space bar does the same.
- Sound is generated in the browser with **WebAudio**: additive synthesis with an envelope, vibrato for violin and flute. No audio samples to download.
- It plays **chords, rests, ties, dynamics, staccato and accents**, on one or two staves together.
- The **total duration** (e.g. `0:18`) is always visible.

---

## Files: save, download, load

| Button | Result |
|---|---|
| **Download MIDI** (*Scarica MIDI*) | A **standard MIDI file** (format 1, 480 PPQ) containing tempo, time signature, key, instrument, dynamics and the notes of the staves. It is delivered **inside a ZIP** (`.zip`), because the Artifact viewer does not allow a direct `.mid` download: extract the file and open it with any music software. |
| **Download PDF** (*Scarica PDF*) | A **printable A4 page** with title, bar numbers, key signature, clefs, brace and dynamics. The PDF is produced by a built-in writer, with no external libraries. |
| **Save project** (*Salva progetto*) | A **JSON** file with the whole score (title, time signature, tempo, instrument, key, staves): the most faithful way to resume work. |
| **Load MIDI** (*Carica MIDI*) | Opens a `.mid`, a `.zip` containing one, or a `.json` project. You can also **drag the file onto the score**. Notes appear on the staff with the file's tempo, time signature, key and instrument; rhythms are mapped to the available note values. |

---

## Phone layout

Below 760 px of width the interface changes:

- the **score stays pinned at the top** (limited height, it scrolls by itself) while the rest scrolls below;
- the sections are gathered in a **side menu on the right**, opened with the **☰** button: *Note · Piano · Modifica · Brano · File*;
- a **fixed footer** keeps **Play, Undo, Redo**, the piece's duration and the ☰ button always within thumb's reach;
- keys and buttons have **large touch targets**; the pop-up menu for the selected note becomes a bottom sheet;
- it respects iPhone safe areas (notch and bottom bar).

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `A` … `G` | Write the note (C–B) |
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

- **A single HTML file** with inline CSS and JavaScript; the music symbols (clefs, rests, accidentals, brace, flags) are vector paths derived from the *Noto Music* font and embedded.
- **Data model**: each staff is `{clef, events}`; a note is `{v, dot, n:[{d, a, t}]}` where `d` is a diatonic number and `a` the accidental; a rest is `{r:true, v, dot}`. Resolution is **480 PPQ**.
- **A "pure" part** (no DOM) covered by automated tests in Node: MIDI reading/writing, ZIP, bar splitting with ties, transposition, quantization, duration scaling, duration from touch, score layout, SVG rendering and PDF writing.
- **Rendering**: the score is an SVG computed by a dedicated layout (positions, beams, ledger lines, slurs); the same layout feeds the PDF.
- **Audio**: WebAudio for synthesis; Web MIDI for the external keyboard.
- **Archives**: *stored* (uncompressed) ZIP reading and writing implemented by hand, CRC-32 included.

---

## Known limitations

- The **sound** is synthesized: pleasant, but not sampled real instruments.
- The **MIDI keyboard** needs a browser with Web MIDI (Chrome, Edge) and the user's permission; some embedded environments block it.
- The **MIDI download** arrives as a ZIP because of the viewer's restrictions.
- The `;` `'` `[` keys of the *Middle C on H* layout depend on the **physical keyboard**: on layouts other than Italian/English they may sit elsewhere.
- Importing very complex MIDI (multiple voices, triplets, tempo changes) **simplifies** the score to the chosen grid.
- One tempo and one time signature for the whole piece (no mid-piece changes).

---

*Quaderno di musica — write, listen, export.*
