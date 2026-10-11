# 🎼 Quaderno di musica

**Un editor di spartiti musicali che vive in una sola pagina web.**
Scrivi le note sul pentagramma (con il mouse, il tocco, la tastiera del computer o un pianoforte MIDI), ascoltale subito con un sintetizzatore integrato e porta via il lavoro in **MIDI**, **PDF** o **progetto JSON**. Puoi anche ricaricare un MIDI e modificarlo.

Tutta l'applicazione è un unico file HTML: nessuna installazione, nessun server, nessun account. I dati restano nel tuo browser; l'unica cosa che esce sono i file che scegli di scaricare.

---

## Indice

1. [Panoramica](#panoramica)
2. [Impostazioni del brano](#impostazioni-del-brano)
3. [Scrivere le note](#scrivere-le-note)
4. [Il pianoforte sullo schermo](#il-pianoforte-sullo-schermo)
5. [Registrare suonando](#registrare-suonando)
6. [Selezionare e modificare](#selezionare-e-modificare)
7. [Trasformare lo spartito](#trasformare-lo-spartito)
8. [Ascolto](#ascolto)
9. [File: salvare, scaricare, caricare](#file-salvare-scaricare-caricare)
10. [Versione per telefono](#versione-per-telefono)
11. [Scorciatoie da tastiera](#scorciatoie-da-tastiera)
12. [Come è fatto dentro](#come-è-fatto-dentro)
13. [Limiti noti](#limiti-noti)

---

## Panoramica

| Cosa puoi fare | Come |
|---|---|
| Scrivere uno spartito su **uno o due pentagrammi** | Clic sul pentagramma, tasti `A`–`G`, pianoforte a schermo, tastiera del PC, tastiera MIDI |
| Scegliere **tempo, metro, armatura e chiave** | Pannello delle impostazioni |
| **Ascoltare** il brano | Pulsante *Ascolta* (sintetizzatore nel browser, 6 strumenti) |
| **Registrare** suonando in tempo reale | Pulsante *Registra*, con giro di metronomo iniziale |
| **Correggere** note, durate, alterazioni | Selezione, menu a comparsa, annulla/ripristina |
| **Trasportare, quantizzare, scalare** le durate | Sezione *Modifica* |
| **Esportare** | MIDI (dentro un file ZIP), PDF A4 stampabile, progetto JSON |
| **Importare** | File MIDI, ZIP con MIDI, progetto JSON (anche trascinandolo sullo spartito) |

---

## Impostazioni del brano

- **Titolo**: scritto sopra lo spartito, compare nel PDF e nel MIDI.
- **Armatura di chiave**: 15 armature, da 7 bemolli a 7 diesis (Do maggiore / La minore, Sol maggiore / Mi minore, Fa maggiore / Re minore, …). Le alterazioni dell'armatura si applicano da sole alle note che scrivi.
- **Metro**: 2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8, 5/4. Le battute si tracciano di conseguenza.
- **Pentagrammi**: uno solo oppure due (**pentagramma doppio da pianoforte**, con graffa).
- **Chiave**, per ciascun pentagramma, tra le sette chiavi storiche:
  Violino (Sol), Soprano, Mezzosoprano, Contralto, Tenore (le quattro chiavi di Do), Baritono e Basso (chiavi di Fa).
- **Tempo**: da 30 a 240 battiti al minuto, con cursore e campo numerico; accanto compare il termine musicale (Adagio, Andante, Allegro…).
- **Strumento**: Pianoforte, Pianoforte elettrico, Organo, Violino, Clarinetto, Flauto. Lo strumento scelto viene scritto nel MIDI come programma General MIDI.

---

## Scrivere le note

Lo spartito ha un **cursore** (la barra verde) che indica dove finirà la prossima figura.

**Durate** (pulsanti con la figura disegnata): semibreve 1/1, **minima 1/2**, semiminima 1/4, croma 1/8, semicroma 1/16, biscroma 1/32.

**Modifiche della figura** (pulsanti *Modifiche*):

- **Punto (+½)**: aggiunge metà del valore.
- **Diesis ♯ / Bemolle ♭ / Bequadro ♮**: alterazione della nota seguente.
- **Pausa**: inserisce una pausa della durata scelta.
- **Accordo**: le note nuove si sovrappongono alla precedente invece di avanzare.
- **Legatura**: lega la nota alla successiva se ha la stessa altezza.
- **Sovrascrivi**: le note nuove sostituiscono quelle esistenti anziché spingerle in avanti.
- **Elimina**: cancella la figura selezionata o quella prima del cursore.

**Automatismi utili**

- Quando una nota supera la **stanghetta di battuta**, viene **spezzata e legata** da sola.
- Le figure vicine vengono **unite con le travature** (come su uno spartito stampato).
- Le note fuori dalle righe hanno i **tagli addizionali**.
- Puoi anche **cliccare sul pentagramma** per inserire una nota a quell'altezza (con `Maiusc` come accordo).

**Dinamiche e segni**

- Dinamica *dalla figura in poi*: **pp, p, mp, mf, f, ff** (cambiano il volume della riproduzione e compaiono sullo spartito e nel PDF).
- **Staccato** (la nota dura la metà), **Accento** (suona più forte).
- **Legatura di frase** (arco) su più figure selezionate.
- **Togli segni**: rimuove dinamica, staccato, accento e legature di frase.

---

## Il pianoforte sullo schermo

Sotto lo spartito c'è una tastiera da pianoforte scorrevole.

- **Tocca/clicca un tasto** → suona e scrive la nota alla durata scelta.
- **Nomi sui tasti**: *Do Re Mi*, *C D E* oppure nessun nome.
- **Ottava** più alta/bassa con i pulsanti − e +.
- **⌫ Cancella**: toglie l'ultima nota scritta (o quella selezionata), come il tasto Backspace.
- **Quantizza a**: la griglia (da semibreve a biscroma) usata da *Registra* e da *Durata dal tocco*.
- **Durata dal tocco**: la **durata viene decisa da quanto tieni premuto il tasto**. Durante la pressione compare la durata calcolata; al rilascio la nota si scrive con la figura più vicina.
- **Tastiera del PC**: le lettere del computer suonano il pianoforte. Sui tasti sono indicate le lettere da premere. Due disposizioni:
  - *Z–M e Q–U (due ottave)*: fila bassa `Z X C V B N M` (con i neri `S D G H J`) e fila alta `Q W E R T Y U I` (con i neri `2 3 5 6 7`).
  - *Do centrale su H*: il Do centrale è `H`; le bianche sono la fila `A S D F G H J K L ; '` e i neri la fila sopra (`E R T · U I · P [`).
- **Collega tastiera MIDI**: usa una tastiera MIDI vera tramite Web MIDI (vedi [Limiti noti](#limiti-noti)).
- **Metronomo**: colpo a tempo per tenere il ritmo.

---

## Registrare suonando

1. Scegli tempo e metro, poi premi **Registra**.
2. Parte un **giro di metronomo** (count-in) per darti l'attacco.
3. Suona dal pianoforte a schermo, dal PC o da una tastiera MIDI: le note si scrivono sul pentagramma attivo, **rispettando il tempo che hai scelto tu**.
4. Ferma la registrazione: le durate sono **quantizzate** alla griglia scelta (default semicroma) e le pause tra le note diventano pause scritte.

---

## Selezionare e modificare

- **Clic su una figura** per selezionarla; **Maiusc + clic** o **Maiusc + frecce** per selezionare un intervallo.
- **Menu a comparsa** sulla nota selezionata (su telefono si apre dal basso): tutte le operazioni utili in un punto solo — durata, punto, alterazioni, pausa, segni, elimina.
- **↑ / ↓** spostano la nota selezionata di un grado (con Maiusc di un'ottava); **← / →** muovono il cursore o la selezione.
- **Seleziona tutto, Copia, Taglia, Incolla**: lavorano sul pentagramma attivo.
- **Annulla / Ripristina**: cronologia delle modifiche.
- **Nuovo spartito** ricomincia da zero.

---

## Trasformare lo spartito

Tutte le funzioni valgono sull'intero pentagramma attivo oppure solo sulla **selezione**.

| Funzione | Cosa fa |
|---|---|
| **Trasporta** | − / + ottava, tono, semitono. Le alterazioni sono riscritte correttamente. |
| **Quantizza** | Allinea inizio e fine di ogni figura a una griglia (1/1 … 1/32). Le figure più corte della griglia vengono tolte e un avviso lo segnala; la lunghezza totale del brano è conservata. |
| **Scala le durate** | **Raddoppia (×2)** o **Dimezza (÷2)**: la minima diventa semibreve, o semiminima. |

---

## Ascolto

- Il pulsante **Ascolta** (sempre raggiungibile in basso) avvia e ferma la riproduzione; la barra spaziatrice fa lo stesso.
- Il suono è generato nel browser con **WebAudio**: sintesi additiva con inviluppo, vibrato per violino e flauto. Nessun campione audio da scaricare.
- Riproduce **accordi, pause, legature di valore, dinamiche, staccati e accenti**, su uno o due pentagrammi insieme.
- La **durata totale** (es. `0:18`) è sempre visibile.

---

## File: salvare, scaricare, caricare

| Pulsante | Risultato |
|---|---|
| **Scarica MIDI** | File **MIDI standard** (formato 1, 480 PPQ) contenente tempo, metro, armatura, strumento, dinamiche e le note dei pentagrammi. Viene consegnato **dentro uno ZIP** (`.zip`), perché il viewer degli Artifact non consente il download diretto di `.mid`: estrai il file e aprilo con qualsiasi programma musicale. |
| **Scarica PDF** | Pagina **A4 da stampare**, con titolo, numeri di battuta, armatura, chiavi, graffa e dinamiche. Il PDF è generato da un writer interno, senza librerie esterne. |
| **Salva progetto** | File **JSON** con tutto lo spartito (titolo, metro, tempo, strumento, armatura, pentagrammi): il modo più fedele per riprendere un lavoro. |
| **Carica MIDI** | Apre un `.mid`, uno `.zip` che lo contiene o un progetto `.json`. Puoi anche **trascinare il file sullo spartito**. Le note appaiono sul pentagramma con tempo, metro, armatura e strumento del file; i ritmi vengono ricondotti alle figure disponibili. |

---

## Versione per telefono

Sotto i 760 px di larghezza l'interfaccia cambia:

- lo **spartito resta fisso in alto** (altezza limitata, scorre da solo) mentre sotto scorre il resto;
- le sezioni sono raccolte in un **menu laterale a destra**, che si apre con il pulsante **☰**: *Note · Piano · Modifica · Brano · File*;
- un **footer fisso in basso** tiene sempre a portata di pollice **Ascolta, Annulla, Ripristina**, la durata del brano e il pulsante ☰;
- tasti e pulsanti hanno **aree di tocco grandi**; il menu a comparsa della nota selezionata diventa un pannello dal basso;
- rispetta le aree sicure di iPhone (notch e barra inferiore).

---

## Scorciatoie da tastiera

| Tasto | Azione |
|---|---|
| `A` … `G` | Scrive la nota (Do–Si) |
| `Maiusc` + lettera | Aggiunge la nota come accordo |
| `1` … `6` | Durata: semibreve … biscroma |
| `.` | Punto di valore |
| `+` / `-` / `=` | Diesis / bemolle / bequadro |
| `R` | Pausa |
| `T` | Legatura di valore |
| `L` | Legatura di frase |
| `S` | Staccato |
| `>` | Accento |
| `O` | Sovrascrivi on/off |
| `Backspace` / `Canc` | Elimina indietro / avanti |
| `←` `→` | Muove il cursore (con `Maiusc` estende la selezione) |
| `↑` `↓` | Sposta la nota selezionata (senza selezione: cambia pentagramma) |
| `Home` / `Fine` | Inizio / fine del pentagramma |
| `Esc` | Deseleziona |
| `Spazio` | Ascolta / ferma |
| `Ctrl + A / C / X / V` | Seleziona tutto / copia / taglia / incolla |
| `Ctrl + Z` / `Ctrl + Maiusc + Z` | Annulla / ripristina |

---

## Come è fatto dentro

- **Un solo file HTML** con CSS e JavaScript inline; i simboli musicali (chiavi, pause, alterazioni, graffa, code) sono tracciati vettoriali ricavati dal font *Noto Music* e incorporati.
- **Modello dati**: ogni pentagramma è `{clef, events}`; una nota è `{v, dot, n:[{d, a, t}]}` con `d` numero diatonico e `a` alterazione; una pausa è `{r:true, v, dot}`. La risoluzione è **480 PPQ**.
- **Parte "pura"** (senza DOM) e verificata con test automatici in Node: lettura/scrittura MIDI, ZIP, divisione in battute con legature, trasposizione, quantizzazione, scala delle durate, durata dal tocco, layout dello spartito, rendering SVG e scrittura PDF.
- **Rendering**: lo spartito è un SVG calcolato da un layout dedicato (posizioni, travature, tagli addizionali, legature); lo stesso layout alimenta il PDF.
- **Audio**: WebAudio per la sintesi; Web MIDI per la tastiera esterna.
- **Archivi**: scrittura e lettura di ZIP *stored* (senza compressione) implementate a mano; CRC-32 incluso.

---

## Limiti noti

- Il **suono** è sintetizzato: gradevole ma non è un campionamento di strumenti reali.
- La **tastiera MIDI** richiede un browser con Web MIDI (Chrome, Edge) e il permesso dell'utente; alcuni ambienti incorporati la bloccano.
- Il **download** del MIDI arriva come ZIP per i limiti del viewer; in una pagina ospitata altrove si può scaricare il `.mid` diretto.
- I tasti `;` `'` `[` della disposizione *Do centrale su H* dipendono dalla **tastiera fisica**: su layout diversi dall'italiano/inglese possono cambiare posizione.
- Importando MIDI molto complessi (più voci, terzine, tempi variabili) lo spartito viene **semplificato** alla griglia scelta.
- Un solo tempo e un solo metro per l'intero brano (niente cambi a metà).

---

*Quaderno di musica — scrivi, ascolta, esporta.*
