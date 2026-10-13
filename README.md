# 🎼 Quaderno di musica

**Un editor di spartiti musicali che vive in una pagina web.**
Scrivi le note sul pentagramma (con il mouse, il tocco, la tastiera del computer, un pianoforte MIDI o persino canticchiando al microfono), ascoltale subito con un sintetizzatore integrato e porta via il lavoro in **MIDI**, **PDF**, **immagine**, **audio WAV** o **progetto JSON**. Puoi anche ricaricare un MIDI o un MusicXML e modificarlo, allenare l'orecchio con un piccolo gioco di ascolto, e lavorare in **italiano, inglese, francese, spagnolo, tedesco o polacco**.

All'apertura compare per un paio di secondi una schermata con il titolo, poi si apre l'editor: due menu laterali (impostazioni e figure a destra, trasformazioni e file a sinistra) intorno allo spartito e alla tastiera, con una barra di ascolto fissa in basso.

Tutta l'applicazione gira nel browser: nessuna installazione, nessun server, nessun account. I dati restano nel tuo browser (`localStorage`); l'unica cosa che esce sono i file che scegli di scaricare o il link che scegli di condividere.

---

## Indice

1. [Panoramica](#panoramica)
2. [Impostazioni del brano](#impostazioni-del-brano)
3. [Scrivere le note](#scrivere-le-note)
4. [Segni, testo e armonia](#segni-testo-e-armonia)
5. [Autocompletamento e variazioni](#autocompletamento-e-variazioni)
6. [Il pianoforte sullo schermo](#il-pianoforte-sullo-schermo)
7. [Registrare: tastiera, MIDI, microfono](#registrare-tastiera-midi-microfono)
8. [Selezionare e modificare](#selezionare-e-modificare)
9. [Trasformare lo spartito](#trasformare-lo-spartito)
10. [Ascolto e mixer](#ascolto-e-mixer)
11. [Allenamento all'ascolto](#allenamento-allascolto)
12. [File: salvare, scaricare, caricare, condividere](#file-salvare-scaricare-caricare-condividere)
13. [Lingua e tema](#lingua-e-tema)
14. [Versione per telefono](#versione-per-telefono)
15. [Scorciatoie da tastiera](#scorciatoie-da-tastiera)
16. [Come è fatto dentro](#come-è-fatto-dentro)
17. [Limiti noti](#limiti-noti)

---

## Panoramica

| Cosa puoi fare | Come |
|---|---|
| Scrivere uno spartito su **uno o due pentagrammi** | Clic sul pentagramma, tasti `A`–`G`, pianoforte a schermo, tastiera del PC, tastiera MIDI |
| Scegliere **tempo, metro, armatura, chiave e strumento** | Menu impostazioni (destra) |
| **Ascoltare** il brano, con **mixer** per pentagramma | Pulsante *Ascolta*, pannello impostazioni |
| **Registrare** suonando, o **canticchiando** | Pulsanti *Registra* e *Registra dal microfono* |
| **Correggere** note, durate, alterazioni | Selezione, menu a comparsa, annulla/ripristina |
| **Aggiungere** pedale, corona, trillo, mordente, forcelle, lettere di richiamo, testo e accordi | Menu di sinistra, gruppo *Testo e accordi* e *Segni sulle note* |
| **Generare** scale, arpeggi, bassi albertini e variazioni | Menu di sinistra, *Autocompletamento* e *Genera una variazione* |
| **Trasportare, quantizzare, scalare, cercare e sostituire** | Menu di sinistra, sezione *Trasforma* |
| **Allenare l'orecchio** su intervalli e accordi | Menu di destra, *Allenamento all'ascolto* |
| **Esportare** | MIDI (ZIP), PDF A4, immagine PNG, audio WAV, link condivisibile, progetto JSON |
| **Importare** | File MIDI, ZIP con MIDI, MusicXML, progetto JSON (anche trascinandolo sullo spartito) |
| **Lavorare** in 6 lingue e con tema chiaro/scuro/di sistema | Selettori in alto |

---

## Impostazioni del brano

Nel menu di destra, sezione *Impostazioni*:

- **Titolo**: scritto sopra lo spartito, compare nel PDF e nel MIDI.
- **Armatura di chiave**: 15 armature, da 7 bemolli a 7 diesis.
- **Metro**: 2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8, 5/4.
- **Pentagrammi**: uno solo oppure due (pentagramma doppio da pianoforte, con graffa).
- **Chiave**, per ciascun pentagramma, tra le sette chiavi storiche (violino, le quattro di Do, baritono e basso).
- **Tempo**: da 30 a 240 battiti al minuto, con cursore, campo numerico e termine musicale (Adagio, Andante, Allegro…).
- **Strumento**: Pianoforte, Pianoforte elettrico, Organo, Violino, Clarinetto, Flauto. Se lo strumento scelto è traspositore, compare un avviso: il PDF viene scritto nella tonalità che quello strumento deve leggere.
- **Numeri di battuta**: ogni riga, ogni N righe, o nessuno.
- **Zoom** dello spartito (accanto al titolo) e **colori**: nomi delle note sulle teste, un colore per ciascuna nota, oppure un colore per ciascun pentagramma.
- **Stile scritto a mano**: titolo, testo e sigle degli accordi in un carattere corsivo manoscritto, per un effetto più "quaderno".

---

## Scrivere le note

Lo spartito ha un **cursore** (la barra colorata) che indica dove finirà la prossima figura.

**Durate**: semibreve 1/1, **minima 1/2**, semiminima 1/4, croma 1/8, semicroma 1/16, biscroma 1/32.

**Modifiche della figura**:

- **Punto (+½)**: aggiunge metà del valore.
- **Diesis ♯ / Bemolle ♭ / Bequadro ♮**: alterazione della nota seguente.
- **Pausa**: inserisce una pausa della durata scelta.
- **Accordo** (tavolozza, a destra): le note nuove si sovrappongono alla precedente invece di avanzare.
- **Legatura**: lega la nota alla successiva se ha la stessa altezza.
- **Sovrascrivi**: le note nuove sostituiscono quelle esistenti anziché spingerle in avanti.
- **Elimina**: cancella la figura selezionata o quella prima del cursore.
- **Ripeti battuta**: duplica la selezione, o l'ultima battuta se non c'è selezione.

**Automatismi utili**: le figure che superano la battuta vengono spezzate e legate da sole; le figure vicine si uniscono con le travature; le note fuori dalle righe hanno i tagli addizionali; puoi anche cliccare sul pentagramma per inserire una nota a quell'altezza (con `Maiusc` per un accordo).

---

## Segni, testo e armonia

Nel menu di sinistra, oltre alla dinamica classica (**pp, p, mp, mf, f, ff**, staccato, accento, legatura di frase):

- **Pedale**: segno di pedale di risonanza dalla prima all'ultima figura selezionata.
- **Corona**: allunga la nota, solo in ascolto.
- **Trillo** e **Mordente**: solo il segno sulla partitura, non cambiano il suono riprodotto.
- **Crescendo** e **Diminuendo**: forcelle dalla prima all'ultima figura selezionata.
- **Lettera di richiamo**: una lettera (A, B, …) sopra la figura scelta, utile per indicare le sezioni del brano.
- **Testo sotto la nota**: per scrivere il testo cantato (lyrics).
- **Sigla dell'accordo sopra la nota**: scrivi a mano la sigla (es. *Sol7*) oppure premi **Analizza accordi** per farla riconoscere automaticamente, battuta per battuta, dalle note scritte (su tutto il pentagramma o solo sulla selezione).
- **Togli segni**: rimuove dinamica, staccato, accento e legature di frase dalla selezione.

---

## Autocompletamento e variazioni

Sempre nel menu di sinistra:

- **Autocompletamento**: genera, a partire dal cursore, una **scala**, un **arpeggio** o un **basso albertino** nel modo (maggiore/minore) e nella tonalità correnti, con la durata impostata nella tavolozza.
- **Genera una variazione**, su tutto il pentagramma o sulla selezione: **a specchio** (inverte la direzione degli intervalli), **in modo minore** (riscrive la melodia nel relativo minore) o **al rovescio** (la suona all'indietro).
- **Cerca e sostituisci**: sostituisce tutte le occorrenze di una nota (per grado, es. "ogni Fa") con un'altra, su tutto il pentagramma o sulla selezione.

---

## Il pianoforte sullo schermo

Sotto lo spartito c'è una tastiera da pianoforte scorrevole.

- **Tocca/clicca un tasto** → suona e scrive la nota alla durata scelta (finché non è attiva la registrazione: vedi sotto).
- **Nomi sui tasti**: *Do Re Mi*, *C D E* oppure nessun nome.
- **Ottava** più alta/bassa con i pulsanti − e +.
- **⌫ Cancella**: toglie l'ultima nota scritta (o quella selezionata).
- **Quantizza a**: la griglia usata da *Registra* e da *Durata dal tocco*.
- **Durata dal tocco**: la durata viene decisa da quanto tieni premuto il tasto.
- **Tastiera del PC**: le lettere del computer suonano il pianoforte, con due disposizioni (due ottave su Z–M/Q–U, oppure Do centrale su H).
- **Metronomo**, anche con **accelerando** a ogni giro (casella *Aumenta il tempo a ogni giro*).

---

## Registrare: tastiera, MIDI, microfono

1. **Registra**: parte un giro di metronomo (count-in), poi suoni dal pianoforte a schermo, dal PC o da una tastiera MIDI collegata e le note si scrivono sul pentagramma attivo rispettando il tempo scelto; allo stop le durate sono quantizzate e le pause diventano pause scritte.
2. **Collega tastiera MIDI**: finché non è attiva *Registra* o *Durata dal tocco*, ogni nota (o accordo) suonato dalla tastiera MIDI si scrive subito al cursore con la durata scelta nella tavolozza, e il cursore avanza da solo — un **inserimento a passo**, utile per trascrivere velocemente.
3. **Registra dal microfono**: canticchia o suona vicino al microfono; il riconoscimento dell'altezza avviene per **autocorrelazione del segnale audio**, interamente nel browser (nessuna libreria esterna, nessun dato inviato fuori dal browser); le note rilevate si scrivono sul pentagramma attivo.

---

## Selezionare e modificare

- **Clic su una figura** per selezionarla; **Maiusc + clic** o **Maiusc + frecce** per un intervallo.
- **Menu a comparsa** sulla nota selezionata (su telefono si apre dal basso): durata, punto, alterazioni, pausa, segni, elimina.
- **↑ / ↓** spostano la nota selezionata di un grado (con Maiusc di un'ottava); **← / →** muovono il cursore o la selezione.
- **Seleziona tutto, Copia, Taglia, Incolla, Ripeti battuta**.
- **Annulla / Ripristina**: cronologia delle modifiche.
- **Nuovo spartito** ricomincia da zero (anche da un **modello**, vedi [File](#file-salvare-scaricare-caricare-condividere)).

---

## Trasformare lo spartito

Tutte le funzioni valgono sull'intero pentagramma attivo oppure solo sulla **selezione**.

| Funzione | Cosa fa |
|---|---|
| **Trasporta** | − / + ottava, tono, semitono, con le alterazioni riscritte correttamente. |
| **Quantizza** | Allinea inizio e fine di ogni figura a una griglia (1/1 … 1/32); le figure troppo corte vengono tolte con un avviso, la lunghezza totale resta la stessa. |
| **Scala le durate** | Raddoppia (×2) o dimezza (÷2) ogni figura. |
| **Autocompletamento / Variazione / Cerca e sostituisci** | Vedi [Autocompletamento e variazioni](#autocompletamento-e-variazioni). |

---

## Ascolto e mixer

- Il pulsante **Ascolta** (sempre raggiungibile in basso) avvia e ferma la riproduzione; la barra spaziatrice fa lo stesso.
- Il suono è generato nel browser con **WebAudio**: sintesi additiva con inviluppo, vibrato per violino e flauto.
- Nel menu impostazioni trovi: **velocità di riproduzione** (50–100%), **riproduzione ciclica della selezione**, **swing**, **riverbero**, **stereo per pentagramma** (un canale a sinistra, l'altro a destra) e, per ciascun pentagramma, **solo / muto / volume**.
- Riproduce accordi, pause, legature, dinamiche, forcelle, pedale, corona, staccati e accenti, su uno o due pentagrammi insieme.
- La durata totale è sempre visibile accanto al pulsante Ascolta.

---

## Allenamento all'ascolto

Un piccolo gioco, nel menu di destra:

- Scegli il tipo di esercizio — **intervalli** o **accordi**.
- **Nuovo** fa suonare un intervallo o un accordo a caso; scegli la risposta tra i pulsanti proposti.
- **Riascolta** ripete l'ultimo suono senza cambiarlo.
- Il punteggio delle risposte corrette resta visibile sotto gli esercizi.

---

## File: salvare, scaricare, caricare, condividere

| Pulsante | Risultato |
|---|---|
| **Scarica MIDI** | File MIDI standard (formato 1, 480 PPQ), dentro un archivio ZIP (il viewer non consente il download diretto di `.mid`): estrailo per usarlo altrove, o ricarica qui lo ZIP così com'è. |
| **Scarica PDF** | Pagina A4 da stampare, con titolo, numeri di battuta, dinamiche, testo e sigle degli accordi; se lo strumento è traspositore, la tonalità del PDF è quella che lo strumento deve leggere. |
| **Esporta immagine** | Un PNG di tutto lo spartito, o solo della selezione se ce n'è una. |
| **Esporta audio (WAV)** | Lo stesso suono dell'ascolto nella pagina, incluso riverbero, registrato offline e scaricato come file `.wav`. |
| **Copia link condivisibile** | Copia un indirizzo che contiene l'intero brano, compresso, dentro il link stesso: chi lo apre vede subito lo spartito, senza bisogno di un server o di un file da scambiarsi. |
| **Salva progetto** | File JSON con tutto lo spartito: il modo più fedele per riprendere un lavoro. |
| **Carica MIDI** | Apre un `.mid`, uno `.zip` che lo contiene, un **MusicXML** (`.xml`/`.musicxml`) o un progetto `.json`; puoi anche trascinare il file sullo spartito. |
| **Nuovo spartito** / **Nuovo da modello** | Ricomincia da zero, oppure da uno dei modelli pronti (pianoforte a due pentagrammi, voce e pianoforte, strumento solista). |
| **Salva versione / Ripristina versione / Elimina versione** | Istantanee **nominate** del brano, salvate nel browser: utile per tenere più varianti dello stesso pezzo, oltre al normale Annulla/Ripristina. |

---

## Lingua e tema

- **Lingua** (selettore in alto a destra): italiano, inglese, francese, spagnolo, tedesco, polacco. Cambia a runtime tutta l'interfaccia — etichette, pulsanti, suggerimenti, messaggi e scorciatoie — e resta salvata per le visite successive.
- **Tema** (selettore accanto): chiaro, scuro, o secondo le impostazioni del sistema.

---

## Versione per telefono

Sotto i 760 px di larghezza l'interfaccia cambia:

- lo **spartito resta fisso in alto** (altezza limitata, scorre da solo) mentre sotto scorrono tastiera e tavolozza;
- i due menu laterali diventano **pannelli a scomparsa**: uno scorre da **sinistra** (modifica e file), l'altro da **destra** (impostazioni e figure), aperti dai due pulsanti nella barra in basso;
- un **footer fisso in basso** tiene sempre a portata di pollice Ascolta, Annulla, Ripristina, la durata del brano e i due pulsanti dei menu;
- tasti e pulsanti hanno aree di tocco grandi; il menu a comparsa della nota selezionata diventa un pannello dal basso;
- rispetta le aree sicure di iPhone (notch e barra inferiore).

---

## Scorciatoie da tastiera

Le lettere `A`–`G` scrivono sempre le note; le scorciatoie qui sotto sono **personalizzabili** (menu di destra, *Scorciatoie da tastiera*): clicca sul tasto mostrato e poi premi quello nuovo sulla tastiera (`Esc` per annullare); **Ripristina predefinite** le riporta a questi valori.

| Tasto (predefinito) | Azione |
|---|---|
| `Maiusc` + lettera | Aggiunge la nota come accordo |
| `1` … `6` | Durata: semibreve … biscroma |
| `.` | Punto di valore |
| `+` / `-` / `=` | Diesis / bemolle / bequadro |
| `R` | Pausa |
| `T` | Legatura |
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

- **File separati per logica**, niente passaggi di build: `Quadernodimusica.html` è solo lo scheletro (schermata d'avvio, due menu laterali, spartito, tastiera, barra di ascolto); gli stili sono in `css/` (token e tema, impianto a due colonne, componenti, adattamento per telefono) e il JavaScript in `js/`, un file per argomento e caricato in ordine: glifi musicali, modello musicale, battute e legature, lettura/scrittura MIDI, archivio ZIP, trasformazioni, impaginazione e disegno SVG, scrittura del PDF, traduzioni (`00-i18n.js`), stato dell'applicazione, audio, interfaccia, azioni di scrittura e trasformazione, ingresso da tastiera/MIDI/microfono, tocco e mouse, file, versione per telefono, schermata d'avvio, avvio.
- **Traduzioni**: un unico dizionario (`js/00-i18n.js`) con una voce per lingua; il markup statico usa gli attributi `data-i18n`/`data-i18n-title`/`data-i18n-ph`/`data-i18n-aria`/`data-i18n-html`, il testo generato dal codice passa dalla funzione `t(chiave, variabili)`.
- **Modello dati**: ogni pentagramma è `{clef, events}`; una nota è `{v, dot, n:[{d, a, t}]}` con `d` numero diatonico e `a` alterazione; una pausa è `{r:true, v, dot}`. Risoluzione **480 PPQ**.
- **Rendering**: lo spartito è un SVG calcolato da un motore di impaginazione dedicato (posizioni, travature, tagli addizionali, legature); lo stesso layout alimenta il PDF e l'esportazione immagine.
- **Audio**: WebAudio per la sintesi, il riverbero e l'esportazione WAV offline; Web MIDI per la tastiera esterna; `getUserMedia` + autocorrelazione per il riconoscimento dal microfono.
- **Archivi**: lettura e scrittura di ZIP *stored* (senza compressione) implementate a mano, con CRC-32.
- **Condivisione**: il brano viene serializzato in JSON, compresso e codificato in base64 dentro il link (`#share=...`), senza bisogno di un server.

---

## Limiti noti

- Il **suono** è sintetizzato: gradevole ma non è un campionamento di strumenti reali.
- La **tastiera MIDI** richiede un browser con Web MIDI (Chrome, Edge) e il permesso dell'utente; alcuni ambienti incorporati la bloccano.
- Il **riconoscimento dal microfono** funziona meglio con un suono pulito e isolato (voce o strumento monofonico); accordi e rumore di fondo possono confonderlo.
- Il **download** del MIDI arriva come ZIP per i limiti del viewer.
- I tasti `;` `'` `[` della disposizione *Do centrale su H* dipendono dalla tastiera fisica: su layout diversi dall'italiano/inglese possono cambiare posizione.
- Importando MIDI o MusicXML molto complessi (più voci, terzine, tempi variabili) lo spartito viene semplificato alla griglia scelta.
- Un solo tempo e un solo metro per l'intero brano (niente cambi a metà).
- Il **link condivisibile** può diventare molto lungo per brani estesi: alcuni programmi di messaggistica lo troncano.

---

*Quaderno di musica — scrivi, ascolta, esporta.*
