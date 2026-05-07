# Product Backlog

**Projekt:** Miljonimäng — AI ülesannete valideerija
**Grupp:** TAK25
**Töövoog:** Backlog → Todo → In progress → Review/Test → Done

> Märkus: kuna projekt on individuaalne arvestustöö ja repo on lokaalne, siis on backlog hallatud Markdownis (mitte GitHub Issues / Trello), aga sama struktuuriga: iga lugu on eraldi punkt, igaühel on vastuvõtutingimused ja staatus. Kui projekt liigub GitHubi, lisada need ühe-ühele Issue'idena (üks lugu = üks issue).

---

## Sprint 1 — MVP (vajalik arvestuseks)

Eesmärk: tudeng saab valida ülesande, mängida 15 küsimusega mängu ja näha tulemust.

### US-1: Ülesannete nimekiri *(Done)*

**Roll:** õpilane
**Soov:** näha kõikide kättesaadavate ülesannete nimekirja
**Et:** saaksin valida, millise ülesande kohta mängu mängida.

**Vastuvõtutingimused:**
- [x] Kausta `input/` numbrilised alamkaustad ilmuvad nimekirjas.
- [x] Iga rida näitab ID-d ja `assignment.md` esimest pealkirja.
- [x] Tühja `input/` kausta puhul kuvatakse arusaadav teade.
- [x] Mitte-numbrilisi (näiteks `.git`, `node_modules`) ei loeta ülesanneteks.

Seotud failid: `src/fileReader.js`, `server.js` (`GET /api/tasks`), `public/app.js` (`showTaskList`).

---

### US-2: Ülesande valimine ja konteksti laadimine *(Done)*

**Roll:** õpilane
**Soov:** valida konkreetne ülesanne ja näha selle püstitust
**Et:** saaksin enne mängu üle vaadata, mida ma valideerima hakkan.

**Vastuvõtutingimused:**
- [x] Valitud ülesande `assignment.md` kuvatakse renderdatud kujul.
- [x] Backend loeb kõik tugifailid, sh alamkaustadest.
- [x] Failide arv kuvatakse kasutajaliideses.
- [x] Failide lugemine ignoreerib `node_modules`, `.git`, `vendor` jne.

Seotud failid: `src/fileReader.js` (`readTask`), `server.js` (`GET /api/tasks/:id`).

---

### US-3: AI küsimuste genereerimine *(Done)*

**Roll:** õpilane
**Soov:** saada igal mängul **uued** 15 küsimust, mis tuginevad just selle ülesande lahendusele
**Et:** ei saaks vastuseid pähe õppida ja saaksin tegelikult oma arusaamist kontrollida.

**Vastuvõtutingimused:**
- [x] Päring AI-le sisaldab nii `assignment.md` kui ka tugifailide sisu.
- [x] Prompt on dokumenteeritud failis `prompts/question-generation.md`.
- [x] AI vastus parsitakse JSON-iks ja valideeritakse (15 küsimust, igas 4 varianti, üks õige, igaühel selgitus).
- [x] Kui `ANTHROPIC_API_KEY` puudub, kasutatakse mock-küsimusi (sama liides töötab).
- [x] Vea korral kuvatakse kasutajale arusaadav sõnum.

Seotud failid: `src/aiClient.js`, `prompts/question-generation.md`.

---

### US-4: Miljonimängu mängimine *(Done)*

**Roll:** õpilane
**Soov:** vastata 15 valikvastustega küsimusele klassikalises miljonimängu vormingus
**Et:** kogemus oleks äratuntavalt mängulik ja motiveeriv.

**Vastuvõtutingimused:**
- [x] Punktiastmed kuvatakse kõrval (100 → 1 000 000).
- [x] Turvatasemed (5., 10., 15. küsimus) on visuaalselt eristatud.
- [x] Hetke küsimuse number ja punktisumma on alati nähtaval.
- [x] Vastust saab valida ja muuta enne kinnitamist.
- [x] Pärast kinnitamist näidatakse õiget ja valet vastust värvidega.
- [x] Vale vastus lõpetab mängu.
- [x] Õige vastus liigub järgmisele küsimusele.

Seotud failid: `public/app.js`, `public/index.html` (`gameTemplate`), `public/style.css`.

---

### US-5: Selgituse kuvamine pärast vastust *(Done)*

**Roll:** õpilane
**Soov:** näha pärast vastamist, miks vastus oli õige või vale
**Et:** saaksin õppida vigadest, mitte ainult kaotada.

**Vastuvõtutingimused:**
- [x] AI vastus sisaldab iga küsimuse kohta selgitust (`explanation`).
- [x] Selgitus kuvatakse pärast „Kinnita vastus" nupu vajutust.
- [x] Selgitus on näha ka lõpukuvas kõikide vastuste ülevaates.

Seotud failid: `public/app.js` (`confirmAnswer`, `finishGame`).

---

### US-6: Tulemuse kuvamine *(Done)*

**Roll:** õpilane
**Soov:** näha mängu lõpus oma tulemust ja vastuste ülevaadet
**Et:** saaksin aru, kus ma takerdusin ja mida edasi õppida.

**Vastuvõtutingimused:**
- [x] Lõplik punktisumma kuvatakse selgelt.
- [x] Iga küsimuse juures näeb, mis valisin ja mis oli õige.
- [x] Saan mängida sama ülesande uuesti (uued küsimused).
- [x] Saan tagasi nimekirja minna.

---

### US-7: Mängu pooleli jätmine *(Done)*

**Roll:** õpilane
**Soov:** saada mäng pooleli jätta
**Et:** kui pean ära minema, ei pea ma valesti vastama, et lahkuda.

**Vastuvõtutingimused:**
- [x] „Lahku mängust" nupp on kogu mängu jooksul nähtaval.
- [x] Kinnitusdialoog enne lahkumist.
- [x] Pooleli jätmine viib lõpukuvale viimase õigesti vastatud küsimuse punktisummaga.

---

### US-8: Õpetaja lisab uue ülesande *(Done)*

**Roll:** õpetaja
**Soov:** lisada uus ülesanne ilma rakendust ümber kirjutamata
**Et:** sama tööriist kataks kõik kursuse ülesanded.

**Vastuvõtutingimused:**
- [x] Uus numbriline alamkaust `input/`-is ilmub menüüsse automaatselt järgmisel päringul.
- [x] Rakendust ei pea taaskäivitama (failisüsteem loetakse iga päringu juures uuesti).
- [x] README dokumenteerib täpse struktuuri.

---

## Sprint 2 — Lisapunktid (kõrgema hinde jaoks, valikuline)

### US-9: Õlekõrred *(Done)*

**Roll:** õpilane
**Soov:** kasutada õlekõrsi keerulistes küsimustes
**Et:** mäng oleks tasakaalukas ka raskemates astmetes.

**Vastuvõtutingimused:**
- [x] Vähemalt 2 õlekõrt on olemas (saavutatud: 3 — 50:50, AI vihje, publik).
- [x] Iga õlekõrt saab kasutada ainult üks kord mängus.
- [x] Kasutatud õlekõrred on visuaalselt märgistatud.
- [x] AI vihje ei ütle otse õiget varianti (vt `prompts/hint-generation.md`).
- [x] Publiku tulemus ei ole alati 100% õige; lihtsamatel küsimustel on õigele vastuse­le suurem tõenäosus.

---

### US-10: Mock-režiim ilma AI võtmeta *(Done)*

**Roll:** arendaja / õpetaja
**Soov:** saada rakendus käima ka ilma Anthropic API võtmeta
**Et:** demo, hindamine ja ülevaatamine ei sõltuks võtmest.

**Vastuvõtutingimused:**
- [x] Rakendus käivitub edukalt ilma `ANTHROPIC_API_KEY`-ta.
- [x] AI staatus on UI-s selgelt nähtav (kollane = pilv, roheline = CLI, hall = mock).
- [x] Mock genereerib 15 küsimust, mis kasutavad ülesande pealkirja ja faili­nimesid, et kontekst oleks vähemalt osaliselt seotud.

---

### US-11: Päris AI ilma API võtmeta — Claude CLI serveris *(Done)*

**Roll:** õpilane / hindaja
**Soov:** kui rakendus jookseb minu serveris, kus olen Claude Code CLI-ga sisse logitud, läheks päring sealt edasi mudelisse — ilma et kuhugi peaks API võtit panema.
**Et:** brauseris kasutaja saab päris AI-genereeritud sisuga küsimusi, kuid kogu Anthropic'uga suhtlemine käib ühe inimese (serveri omaniku) tellimuse alt.

**Vastuvõtutingimused:**
- [x] Rakendus tuvastab automaatselt, kas `claude` binaar on PATH-il (`claude --version` exit code 0).
- [x] Allikate prioriteet: `ANTHROPIC_API_KEY` > Claude CLI > mock.
- [x] `USE_CLAUDE_CLI=true` forsseerib CLI-eelistuse ka võtme olemasolul; `USE_CLAUDE_CLI=false` keelab CLI tuvastuse.
- [x] Sama prompt (`prompts/question-generation.md`) töötab kõigil kolmel allikal.
- [x] Sama JSON-leping ja sama valideerimine (15 küsimust, 4 varianti, üks õige, selgitus, raskusaste).
- [x] CLI helistatakse `child_process.spawn`-iga (mitte shell'i kaudu) — koodisisu argv'sse otse, ei pea escaping'uga maadlema.
- [x] Süsteemi prompt edastatakse `--append-system-prompt` lipuga, kasutaja sõnum `-p` argumendiga.
- [x] CLI-protsessile määratud timeout (vaikimisi 4 min); aeglane vastus ei jäta päringut igavesti rippuma.
- [x] Vea/timeout korral selge sõnum UI-s, mitte rakenduse kukkumine.
- [x] Frontend näitab rohelist silti „Claude CLI (<mudel>)" kui see on aktiivne.
- [x] README dokumenteerib Hetzneri-stiilis paigaldusvoogu (paigalda → `claude /login` → `npm start`).

Seotud failid: `src/claudeCliClient.js`, `src/aiClient.js` (ruuter), `.env.example`, `README.md`.

---

## Backlog (tulevased iteratsioonid, planeerimata)

- **US-12:** Tulemuste salvestamine kohalikku andmebaasi (SQLite) ja mänguajaloo vaade.
- **US-13:** Genereeritud küsimuste vahemälu, et sama ülesande sama versiooni puhul saaks taas­kasutada.
- **US-14:** Kasutajate süsteem (õpilane / õpetaja rollid).
- **US-15:** Õpetaja vaade — kõikide õpilaste tulemused ühes kohas.
- **US-16:** Veebiliides ülesannete lisamiseks (üleslaadimine).
- **US-17:** Süntaksivärvimine koodifailide kuvamisel (`highlight.js`).
- **US-18:** Korralik Markdown render (`marked` paketi täielik kasutus, mitte minimaalne renderer).
- **US-19:** Mitmekeelne UI (eesti / inglise).

---

## Töö staatuse jälgimine

| ID | Lugu | Staatus | Sprint |
|----|------|---------|--------|
| US-1 | Ülesannete nimekiri | Done | 1 |
| US-2 | Ülesande valimine | Done | 1 |
| US-3 | AI küsimused | Done | 1 |
| US-4 | Mängimine | Done | 1 |
| US-5 | Selgitus | Done | 1 |
| US-6 | Tulemus | Done | 1 |
| US-7 | Pooleli jätmine | Done | 1 |
| US-8 | Õpetaja lisab ülesande | Done | 1 |
| US-9 | Õlekõrred | Done | 2 |
| US-10 | Mock-režiim | Done | 2 |
| US-11 | Claude CLI serveris | Done | 2 |
| US-12..19 | Vt backlog | Backlog | — |

---

## Miks selline järjekord?

1. **MVP esimesena.** Sprint 1 katab kõik miinimumnõuded arvestuseks. Iga lugu on eraldi vajalik (US-1..US-8). Ilma neist ükskõik millise täitmata jätmata pole arvestus saavutatav.
2. **Failide lugemine ja AI eraldamine kohe alguses.** US-2 ja US-3 viidi lahku, sest AI integratsiooni saab pärast asendada (mock vs päris) ilma fail­ireaderit puudutamata. See annab ka vabaduse demoda ka ilma võtmeta (US-10).
3. **Õlekõrred ja mock-režiim eraldi sprindis.** Need ei ole arvestuse jaoks vajalikud, aga annavad lisapunkte. Kui aeg saab otsa, jääb MVP ikka töökorda.
4. **US-11..18 jäeti välja** sihilikult — need oleksid suurendanud konteksti ilma minimaalseid nõudeid täiendamata. Vt edasiarenduse võimalused README-s.
