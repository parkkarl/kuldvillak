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

### US-3: Eelgenereeritud küsimustepank *(Done)*

**Roll:** õpilane
**Soov:** saada igal mängul küsimusi, mis tuginevad just selle ülesande lahendusele, ja varieeruvad piisavalt, et ei saaks pähe õppida
**Et:** kontrollin tegelikku arusaamist, mitte mälu.

**Disainotsus:** runtime AI asemel **eelgenereeritud küsimustepank** (50+ küsimust ülesande kohta, käsitsi koostatud arenduskeskkonnas Claude'iga). Põhjus: kiire start (pole vaja API-võtit ega välist teenust), hindajale 100% deterministlik demo, küsimused on käsitsi-validateeritud kvaliteet.

**Vastuvõtutingimused:**
- [x] Iga ülesande kaustas on `questions.json` 50+ küsimusega (kokku 153 küsimust 3 ülesandel).
- [x] Iga raskuse-tase (1–15) on kaetud vähemalt ühe küsimusega — pankade valideerija jookseb ja blokib käivituse, kui ühe pank on puudulik.
- [x] Server valib igale mängule juhuslikult ühe küsimuse igalt raskuselt → 15 küsimust raskusega 1..15.
- [x] Vastusevariandid (A/B/C/D) segatakse iga küsimuse jaoks juhuslikku järjekorda.
- [x] Iga küsimusega on kaasas selgitus, mis kuvatakse pärast vastust.
- [x] Küsimustepanga formaat ja valideerimisreeglid on README-s dokumenteeritud.

Seotud failid: `src/questionStore.js`, `input/<id>/questions.json`.

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
- [x] Vähemalt 2 õlekõrt on olemas (saavutatud: 50:50 ja publik).
- [x] Iga õlekõrt saab kasutada ainult üks kord mängus.
- [x] Kasutatud õlekõrred on visuaalselt märgistatud.
- [x] Publiku tulemus ei ole alati 100% õige; lihtsamatel küsimustel on õigele vastusele suurem tõenäosus.

---

### US-10: Variatsioon iga mängu vahel *(Done)*

**Roll:** õpilane
**Soov:** et iga mäng oleks vähemalt osaliselt erinev — ei saaks lihtsalt vastuseid pähe õppida
**Et:** kontroll on kvaliteetne, mitte mehhaaniline.

**Vastuvõtutingimused:**
- [x] Iga raskuse-tasemel on pangakomplektis mitu kandidaati (~3–4) → server valib juhuslikult ühe.
- [x] Vastuse-variandid (A/B/C/D) segatakse iga küsimuse jaoks juhuslikku järjekorda.
- [x] Empiiriline test: kahe järjestikuse mängu vahel kattub keskmiselt < 50% küsimusi (vt TESTING.md).

---

## Disainimuudatus mid-projekt: AI runtime → eelgenereeritud pank

Algses sprindis 1 oli US-3 dünaamiline AI-küsimuste genereerimine (Anthropic API + mock-fallback). Sprindis 2 katsetati ka Claude CLI integratsiooni (`claude -p`), et saaks ilma API-võtmeta päris AI-d kasutada.

Pärast Hetzneri-deployd ilmnesid kaks reaalset probleemi:

1. **Aeglus** — `claude -p` käivitusaeg + 15-küsimuse genereerimine võttis 30–90 s. Brauseri spinner ja kasutaja kannatus halvenesid.
2. **Auth-haprus** — CLI auth-token aegus ja vajas re-login-i; konteineri ja host'i `.claude.json` ei jaganud sama session-it.

**Otsus:** loobuda runtime AI-st täielikult; küsimused on nüüd **eelgenereeritud staatilised pangad** (`questions.json` igal ülesandel). Variatsioon tuleb juhuslikust valikust pankade seest + variantide segamisest.

**Mis tähendab Backlog-i jaoks:**
- US-3 ümberkirjutatud disain: AI küsimused → eelgenereeritud pank.
- US-9 ümbersõnastatud: AI vihje õlekõrre eemaldatud, jäid 50:50 ja publik.
- Kustutatud (jäid varasemast): US-10 (mock-režiim) ja US-11 (Claude CLI) — pole enam asjakohased, sest AI runtime'i pole.

---

## Backlog (tulevased iteratsioonid, planeerimata)

- **US-11:** Tulemuste salvestamine kohalikku andmebaasi (SQLite) ja mänguajaloo vaade.
- **US-12:** Veebiliides küsimustepanga laiendamiseks (õpetaja saab brauseris lisada uue küsimuse).
- **US-13:** Kasutajate süsteem (õpilane / õpetaja rollid).
- **US-14:** Õpetaja vaade — kõikide õpilaste tulemused ühes kohas.
- **US-15:** Veebiliides ülesannete lisamiseks (üleslaadimine).
- **US-16:** Süntaksivärvimine koodifailide kuvamisel (`highlight.js`).
- **US-17:** Mitmekeelne UI (eesti / inglise).
- **US-18:** Vajadusel hiljem AI-genereerimise tagasitoomine (kui demo-aegne kvaliteet on tõstatanud küsimuse).

---

## Töö staatuse jälgimine

| ID | Lugu | Staatus | Sprint |
|----|------|---------|--------|
| US-1 | Ülesannete nimekiri | Done | 1 |
| US-2 | Ülesande valimine | Done | 1 |
| US-3 | Eelgenereeritud küsimustepank | Done | 1 |
| US-4 | Mängimine | Done | 1 |
| US-5 | Selgitus | Done | 1 |
| US-6 | Tulemus | Done | 1 |
| US-7 | Pooleli jätmine | Done | 1 |
| US-8 | Õpetaja lisab ülesande | Done | 1 |
| US-9 | Õlekõrred (50:50, publik) | Done | 2 |
| US-10 | Variatsioon iga mängu vahel | Done | 2 |
| US-11..18 | Vt backlog | Backlog | — |

---

## Miks selline järjekord?

1. **MVP esimesena.** Sprint 1 katab kõik miinimumnõuded arvestuseks. Iga lugu on eraldi vajalik (US-1..US-8). Ilma neist ükskõik millise täitmata jätmata pole arvestus saavutatav.
2. **Failide lugemine ja AI eraldamine kohe alguses.** US-2 ja US-3 viidi lahku, sest AI integratsiooni saab pärast asendada (mock vs päris) ilma fail­ireaderit puudutamata. See annab ka vabaduse demoda ka ilma võtmeta (US-10).
3. **Õlekõrred ja mock-režiim eraldi sprindis.** Need ei ole arvestuse jaoks vajalikud, aga annavad lisapunkte. Kui aeg saab otsa, jääb MVP ikka töökorda.
4. **US-11..18 jäeti välja** sihilikult — need oleksid suurendanud konteksti ilma minimaalseid nõudeid täiendamata. Vt edasiarenduse võimalused README-s.
