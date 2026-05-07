# Miljonimäng

Ülesannete valideerimise rakendus, mis töötab "Kes tahab saada miljonäriks?" põhimõttel ja kasutab eelgenereeritud küsimustepanka.

## Projekti kirjeldus

Rakendus kontrollib, kas õppija saab aru enda või kellegi teise tehtud ülesande lahendusest. Kasutaja valib ülesande kaustast `input/`, server loeb sama ülesande **eelgenereeritud küsimustepanga** failist `questions.json` ning valib igale mängule 15 küsimust raskusastmetes 1–15. Vale vastus lõpetab mängu, õige liigub edasi.

Vt arendusprotsessi ja kasutajalugusid: [`docs/BACKLOG.md`](docs/BACKLOG.md), [`docs/PLANNING.md`](docs/PLANNING.md), [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md), [`docs/TESTING.md`](docs/TESTING.md).

## Kasutatud tehnoloogiad

- **Backend:** Node.js (≥18) + Express 4 — ainus npm-sõltuvus
- **Frontend:** vanilla HTML / CSS / JavaScript ESM, ilma raamistikuta
- **Küsimused:** staatilised JSON-failid, igal ülesandel oma `questions.json` (kokku 153 küsimust kolmel näidisülesandel)
- **Failide lugemine:** Node `node:fs/promises`, ignoreerib `node_modules`, `.git`, `vendor` jt
- **Konfiguratsioon:** `.env` fail (vt `.env.example`)

## Käivitamise juhend

### Kohalik arendus

```bash
git clone <see repo>
cd kuldvillak
npm install
npm start
# Ava: http://localhost:3000
```

### Docker

```bash
docker compose up -d --build
# Ava: http://localhost:3010
```

## Input-kausta struktuur

Iga ülesanne on `input/` all eraldi numbrilises alamkaustas. Iga ülesande kaustas on:

- `assignment.md` — ülesande püstitus, nõuded, hindamiskriteeriumid (kohustuslik).
- `questions.json` — eelgenereeritud küsimustepank (kohustuslik mängu jaoks).
- Lahenduse failid — mistahes formaadis, mistahes alamkaustas.

```text
input/
  001/
    assignment.md
    questions.json        # 53 küsimust raskuses 1-15
    index.html
    style.css
    script.js
  002/
    assignment.md
    questions.json        # 50 küsimust
    src/
      index.html
      app.js
      style.css
      data.json
  003/
    assignment.md
    questions.json        # 50 küsimust
    index.html
    style.css
    script.js
```

Reeglid:

- Ainult numbrilised alamkaustad (`001`, `042`, `100`) loetakse ülesanneteks.
- `assignment.md` esimese pealkirja (`# Pealkiri`) põhjal koostatakse menüü-nimi.
- Ignoreeritavad kaustad: `node_modules`, `.git`, `vendor`, `dist`, `build`, `__pycache__`, `.venv`, `.idea`, `.vscode`, `.cache`.

## questions.json formaat

Iga küsimustepank on JSON-massiiv, kus iga objekt on:

```json
{
  "level": 1,
  "question": "Mis on selle ülesande peamine eesmärk?",
  "options": [
    "Saata e-kirju kasutaja sõpradele",
    "Teha brauseris töötav kalkulaator nelja põhitehte jaoks",
    "Kuvada Eesti raamatute nimekirja",
    "Salvestada andmeid serverisse"
  ],
  "correctIndex": 1,
  "explanation": "assignment.md sõnastab eesmärgina kalkulaatori..."
}
```

Validatsioonireeglid (`src/questionStore.js`):

- `level` — täisarv 1–15
- `options` — täpselt 4 stringi
- `correctIndex` — 0–3
- `explanation` — string (kuvatakse pärast vastust)

## Mängu reeglid

- **15 küsimust**, igal 4 vastusevarianti, üks õige.
- **Üks küsimus iga raskuse pealt (1..15)** → küsimused lähevad järjest keerulisemaks.
- **Valikul on mitu kandidaati** igal raskuse-tasemel (~3–4 küsimust per tase pankadel) → kahe mängu vahel kattub keskmiselt umbes kolmandik küsimusi.
- **Vastusevariandid (A/B/C/D)** segatakse iga küsimuse jaoks juhuslikult — sama küsimus näitab vastuseid erinevas järjekorras.
- **Punktiastmed:** 100, 200, 300, 500, 1 000, 2 000, 4 000, 8 000, 16 000, 32 000, 64 000, 125 000, 250 000, 500 000, 1 000 000.
- **Turvatasemed** 5., 10., 15. küsimuse järel. Vale vastus → tulemus langeb viimasele saavutatud turvatasemele.
- **Mängu saab pooleli jätta** — tulemus jääb viimase õigesti vastatud küsimuse punktiseisu.
- **Õlekõrred (kumbki kasutatav 1 kord):**
  - **50:50** — eemaldab kaks valet vastusevarianti.
  - **Küsi publikult** — kuvab simuleeritud hääletuse. Lihtsamatel küsimustel saab õige vastus suurema osakaalu.

## Küsimuste genereerimise loogika

Kuna kõik küsimused on **eelgenereeritud** (mitte AI poolt mängu ajal), siis serveri-poolne loogika on minimaalne:

1. **Laadimine** (`loadBank`) — loeb `input/<id>/questions.json`-i, parsib JSON-i, valideerib igale küsimusele struktuuri.
2. **Valik** (`pickFifteen`) — grupeerib küsimused taseme järgi, valib igalt raskuselt (1..15) ühe juhusliku kandidaadi.
3. **Variantide segamine** (`shuffleQuestionOptions`) — segab iga valitud küsimuse vastusevariandid juhuslikku järjekorda ja arvutab `correctIndex`-i ümber.

Küsimused on Claude'iga genereeritud arenduse käigus käsitsi — kvaliteet on pedagoogiline (kontseptsioonide arusaam, mitte mälu) ja igal raskuse-tasemel on katkestamatuid kandidaate.

## Teadaolevad piirangud

- **Pole päriselt dünaamiline AI** — küsimused on kompileerimisaegsed. Uue ülesande lisamisel tuleb käsitsi koostada `questions.json` (nt küsides Claude'ilt arenduskeskkonnas).
- **50 küsimuse pealt 15 valida tähendab, et ~30% küsimustest näeb iga mäng** — pikemas perspektiivis kasutaja õpib küsimusi pähe, kui mängib sama ülesannet kümneid kordi. Pangapiiri suurendamine (näiteks 100+) parandaks olukorda.
- **Variantide segamise tõttu** ei saa kasutaja õppida pähe „õige vastus on alati B".
- **Tulemuste salvestamist** ja kasutajate süsteemi praeguses versioonis ei ole.
- **Markdown render** on minimaalne (kohandatud renderer ilma teegita).

## Edasiarenduse võimalused

1. Tulemuste salvestamine (SQLite + ajaloo-vaade).
2. **Õpetaja-vaade**, kus saab näha õpilaste tulemusi.
3. Veebiliides ülesannete + küsimuste lisamiseks.
4. Süntaksivärvimine koodifailide kuvamisel.
5. **Dünaamiline küsimustepank** — võimalus hiljem AI-d kasutada uute küsimuste genereerimiseks (kui hindamise nõue muutub).

## Arendusprotsessi ülevaade

Töö ei ole kirjutatud ühe pikalt-möllatud commit'iga. Iga suurem funktsionaalsus on eraldi commit ja seotud konkreetse kasutajalooga `docs/BACKLOG.md`-s. Sprintide kirjeldus ja Definition of Done on `docs/PLANNING.md` ja `docs/DEFINITION_OF_DONE.md`. Vastuvõtutestide tulemused on dokumenteeritud `docs/TESTING.md`-s.
