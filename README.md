# Miljonimäng

AI-põhine ülesande valideerimise rakendus, mis töötab "Kes tahab saada miljonäriks?" põhimõttel.

## Projekti kirjeldus

Rakendus kontrollib, kas õppija saab aru enda või kellegi teise tehtud ülesande lahendusest. Kasutaja valib ülesande kaustast `input/`, AI loeb ülesande püstituse ja lahenduse failid ning genereerib 15 valikvastustega küsimust raskusastme kasvavas järjekorras. Iga küsimus liigub punktiastmel ülespoole; vale vastus lõpetab mängu. Eesmärk pole kontrollida, kas failid on olemas, vaid kas kasutaja mõistab lahenduses kasutatud kontseptsioone, loogikat ja lähteülesande nõudeid.

Vt arendusprotsessi ja kasutajalugusid: [`docs/BACKLOG.md`](docs/BACKLOG.md), [`docs/PLANNING.md`](docs/PLANNING.md), [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md), [`docs/TESTING.md`](docs/TESTING.md).

## Kasutatud tehnoloogiad

- **Backend:** Node.js (≥18) + Express 4
- **Frontend:** vanilla HTML / CSS / JavaScript ESM, ilma raamistikuta — väike lähteülesanne ei õigusta React/Vue keerukust
- **AI:** [Anthropic Claude](https://www.anthropic.com) ametliku SDK kaudu (`@anthropic-ai/sdk`), mudel `claude-sonnet-4-6` (konfigureeritav)
- **Failide lugemine:** Node `node:fs/promises`, ignoreerib `node_modules`, `.git`, `vendor` jt
- **Kogu konfiguratsioon:** `.env` fail (vt `.env.example`)

API võtmeta käivitades töötab rakendus **mock-režiimis** — küsimused genereeritakse lokaalselt deterministliku malli põhjal, et terve mänguvoogu saaks demonstreerida ka ilma võtmeta.

## Käivitamise juhend

```bash
# 1. Klooni või lae alla projekt
cd kuldvillak

# 2. Paigalda sõltuvused
npm install

# 3. (Soovituslik) Lisa Anthropic API võti
cp .env.example .env
# Ava .env ja lisa ANTHROPIC_API_KEY=sk-ant-...

# 4. Käivita server
npm start
# või arendusrežiimis (auto-restart):
npm run dev

# 5. Ava brauser
# http://localhost:3000
```

Kui näed lehe ülaosas kollast silti **„AI ühendus: aktiivne (Anthropic)"**, töötab päris AI integratsioon. Kui silt on hall (**„Demorežiim: mock-küsimused"**), tähendab see, et `ANTHROPIC_API_KEY` puudub või on tühi.

## Input-kausta struktuur

Iga ülesanne on `input/` all eraldi numbrilises alamkaustas. Iga ülesande kaustas peab olema vähemalt fail `assignment.md`. Lahenduse failid võivad olla mistahes formaadis ja mistahes alamkaustas.

```text
input/
  001/
    assignment.md        # ülesande püstitus, nõuded, hindamiskriteeriumid
    index.html
    style.css
    script.js
  002/
    assignment.md
    src/
      index.html
      app.js
      style.css
      data.json
  003/
    assignment.md
    index.html
    style.css
    script.js
```

Reeglid:

- Ainult numbrilised alamkaustad loetakse ülesanneteks (`001`, `042`, `100` jne).
- `assignment.md` esimese pealkirja (`# Pealkiri`) põhjal koostatakse menüüs kuvatav nimi.
- Ignoreeritavad kaustad: `node_modules`, `.git`, `vendor`, `dist`, `build`, `__pycache__`, `.venv`, `.idea`, `.vscode`, `.cache`.
- Maksimaalne ühe faili suurus AI kontekstis: 200 kB. Kogu konteksti maksimum: 800 kB. Üle selle minev sisu kärbitakse.

Uue ülesande lisamiseks ei pea rakenduses midagi muutma — tee uus alamkaust `input/` alla ja taaskäivita server (või lihtsalt vajuta menüüs „Tagasi nimekirja").

## AI küsimuste genereerimise loogika

Süsteemi prompt on dokumenteeritud failis [`prompts/question-generation.md`](prompts/question-generation.md). Lühikokkuvõte:

1. **Sisend AI-le:** ülesande pealkiri, `assignment.md` täistekst ning kõikide tugi-failide sisu (vt eraldused üleval).
2. **Nõuded küsimustele:** täpselt 15 küsimust, igas 4 vastusevarianti, üks õige, igas selgitus, raskusaste 1–15 jaotuses 1–5 = kerge (mõisted), 6–10 = keskmine (sisemine loogika), 11–15 = raske (vigade leidmine, turvariskid, alternatiivid).
3. **Vastuse formaat:** AI tagastab puhta JSON-massiivi, mille kuju on:

   ```json
   [
     {
       "level": 1,
       "question": "...",
       "options": ["A", "B", "C", "D"],
       "correctIndex": 1,
       "explanation": "..."
     }
   ]
   ```

4. **Valideerimine:** `src/aiClient.js` parsib JSON-i, kontrollib igal küsimusel olemasolu, varianti­de arvu ja `correctIndex`-i kehtivust. Vea korral visatakse `Error`, mille frontend kuvab kasutajale.
5. **Vihje (õlekõrs):** eraldi prompt failis [`prompts/hint-generation.md`](prompts/hint-generation.md). AI annab 1–2 lauset, kuid ei tohi nimetada õiget vastust ega tähte.
6. **Iga uue genereerimise puhul** saadab rakendus AI-le sama konteksti, kuid mudeli stohhastilisuse tõttu (temperatuur > 0) on küsimused vähemalt osaliselt erinevad. Mock-režiimis kasutatakse fikseeritud panka (sama lähteülesande puhul samad küsimused), kuna mock-i eesmärk on demonstreerida liidest, mitte randomeerimist.

## Mängu reeglid

- **15 küsimust**, igal 4 vastusevarianti, üks õige.
- Küsimused lähevad **järjest keerulisemaks** (level 1 → 15).
- **Punktiastmed:** 100, 200, 300, 500, 1 000, 2 000, 4 000, 8 000, 16 000, 32 000, 64 000, 125 000, 250 000, 500 000, 1 000 000.
- **Turvatasemed** asuvad 5., 10. ja 15. küsimuse järel (1 000, 32 000, 1 000 000 punkti). Vale vastuse korral langeb tulemus viimasele saavutatud turvatasemele.
- **Kasutaja näeb** punktiastet, hetke küsimuse numbrit ja järgmist turvataset.
- **Mängu saab pooleli jätta** „Lahku mängust" nupuga — tulemuseks jääb viimase õigesti vastatud küsimuse punktisumma.
- **Õlekõrred (3 tk, igaüks 1 kord mängus):**
  - **50:50** — eemaldab kaks valet vastusevarianti.
  - **Küsi AI-lt vihjet** — saadab AI-le küsimuse ja palub 1–2-lauselist suunavat vihjet (mock-režiimis kasutab heuristilist vihjet).
  - **Küsi publikult** — simuleerib hääletustulemust. Lihtsamate küsimuste puhul saab õige vastus suurema tõenäosusega rohkem hääli (vähenev `correctConfidence` raskusastme kasvades).
- **Pärast iga vastust** kuvatakse selgitus, mis tuli AI-lt küsimusega koos.

## Teadaolevad piirangud

- AI mudeli vastus võib aeg-ajalt sisaldada lisateksti enne või pärast JSON-i. `extractJson` parser otsib esimese `[` ja viimase `]` vahel oleva sisu — see töötab ka ümbritseva teksti olemasolul, kuid ei kaitse kõikide võimalike formaadirikete eest.
- Suure ülesande puhul (üle 800 kB tekstifaile) kärbitakse kontekst — väga pikkade lahenduste osa võib AI-le mitte jõuda.
- Vihje-õlekõrs saadab praegu serverisse ainult küsimuse, mitte ülesande täiskonteksti — vihjed tuginevad seetõttu küsimuse enda sisule.
- Tulemuste salvestamist ja kasutajate süsteemi praeguses versioonis ei ole (vt [`docs/BACKLOG.md`](docs/BACKLOG.md) järgmise iteratsiooni nimekirja).
- Mock-režiimis on küsimused üldistatud — sama küsimustepank toimib *mistahes* ülesande peal, st küsimused ei ole sama spetsiifilised kui päris AI väljund. Eesmärk: demonstreerida mängu mehhaanikat ka ilma API-võtmeta.

## Edasiarenduse võimalused

Kataloogina, prioriteetide järjekorras (vt detailid [`docs/BACKLOG.md`](docs/BACKLOG.md)):

1. **Tulemuste salvestamine ja mänguajalugu** — JSON-fail või SQLite serveris, vaade „Eelmised mängud".
2. **Küsimuste vahemällu salvestamine** — sama ülesande sama versiooni puhul ei kutsu AI-d uuesti, kui kasutaja selgelt ei küsi „Genereeri uued küsimused".
3. **Kasutajate süsteem ja õpetaja vaade** — õpilaste tulemused, õpetaja saab näha, kuhu kõik takerdusid.
4. **Veebiliides ülesannete lisamiseks** — praegu peab kausta käsitsi kopeerima.
5. **Markdowni renderdus täismahus** — praegu on minimaalne render, edasiarenduses lisada `marked` (juba sõltuvuste hulgas) + `highlight.js` koodi süntaksivärvimiseks.
6. **Raskusastmete tasakaalustamine** — mõõta empiiriliselt, kas 1–5 / 6–10 / 11–15 jaotus vastab tegelikule raskusele, ja kohendada prompti.

## Arendusprotsessi ülevaade

Töö ei ole kirjutatud ühe pikalt-möllatud commit'iga. Iga suurem funktsionaalsus on eraldi commit ja seotud konkreetse kasutajalooga `docs/BACKLOG.md`-s. Sprintide kirjeldus ja Definition of Done on `docs/PLANNING.md` ja `docs/DEFINITION_OF_DONE.md`. Vastuvõtutestide tulemused on dokumenteeritud `docs/TESTING.md`-s.
