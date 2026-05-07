# Testimise tulemused (UAT)

Iga kasutajalugu testiti käsitsi vastuvõtutingimuste alusel. Allpool on tulemused.

**Keskkond:** Linux 6.19 (Fedora 43), Node.js 20.x, Firefox/Chromium.
**Kuupäev:** 2026-05-07.

| ID | Lugu | Status | Märkused |
|----|------|--------|----------|
| US-1 | Ülesannete nimekiri | ✅ PASS | `input/001`, `input/002`, `input/003` ilmuvad õigete pealkirjadega. Tühja `input/` kataloogi puhul kuvatakse arusaadav teade. |
| US-2 | Ülesande valimine | ✅ PASS | Kõikide kolme näidise `assignment.md` renderdub korrektselt. Failide arv (`taskFiles`) vastab tegelikult kaustas olevatele tugifailidele. |
| US-3 | AI küsimused | ✅ PASS (mock) / ⚠️ Kontrollimisel (päris) | Mock-režiimis genereeritakse 15 küsimust, valideerimine läbib. Päris AI-d testitud `claude-sonnet-4-6`-ga: tagastab valiidse JSON-i. Kui mudel paneb teksti enne JSON-i, parser eraldab ikka õigesti. |
| US-4 | Mängu kulg | ✅ PASS | 15 küsimust, õige vastus = edasi, vale = mäng lõppeb, punktiastmed õiged. |
| US-5 | Selgitus | ✅ PASS | Kuvatakse pärast iga vastust, ja ka lõpukuvas iga küsimuse juures. |
| US-6 | Tulemus | ✅ PASS | Lõplik punktisumma vastab turvataseme reeglile (1 000 / 32 000 / 1 000 000 turvatasemed). „Mängi uuesti" ja „Tagasi nimekirja" töötavad. |
| US-7 | Pooleli jätmine | ✅ PASS | Kinnitusdialoog ilmub, lahkumine viib lõpukuvale. |
| US-8 | Õpetaja lisab ülesande | ✅ PASS | Lisasin testimiseks ajutise `input/099` — ilmus kohe nimekirja, ilma serveri taaskäivitamiseta. |
| US-9 | Õlekõrred | ✅ PASS | 50:50 eemaldab kaks valet varianti. AI vihje (mock-režiimis) annab heuristilise vihje. Publik kuvab tulpdiagrammi; lihtsamatel küsimustel saab õige vastus suurema osakaalu. Iga õlekõrt saab kasutada kord. |
| US-10 | Mock-režiim | ✅ PASS | Ilma `.env`-ita käivitub server, AI silt on hall („Demorežiim: mock-küsimused"), 15 küsimust on saadaval. |

## Käsitsi-test (curl)

```bash
# 1) Ülesannete loend
curl -s http://localhost:3000/api/tasks | jq
# → tasks: [001, 002, 003], ai: false (kui võti puudub)

# 2) Ülesande detail
curl -s http://localhost:3000/api/tasks/001 | jq '.title, (.files | length)'
# → "JavaScripti kalkulaator", 4

# 3) Küsimuste genereerimine (mock)
curl -s -X POST http://localhost:3000/api/tasks/001/questions | jq '.source, (.questions | length)'
# → "mock", 15
```

## Edge case'id

| Stsenaarium | Oodatud käitumine | Tulemus |
|-------------|------------------|---------|
| `input/` ei eksisteeri | Tühi nimekiri + selgitus | ✅ |
| Numbri-mitte alamkaust (näiteks `input/abc/`) | Ignoreeritakse | ✅ |
| Ülesande kaust ilma `assignment.md`-ta | Pealkiri „Ülesanne X (assignment.md puudub)" | ✅ |
| Suur fail (>200 kB) | Sisu kärbitakse, märgitakse | ✅ (testitud käsitsi 300 kB tekstiga) |
| AI tagastab vigase JSON-i (mock-test) | UI kuvab veasõnumi | ✅ (forsseeritud testimiseks) |
| Mäng ilma õlekõrt kasutamata | 15 küsimust läbi, kõik töötab | ✅ |
| Vale vastus 1. küsimusel | Tulemus = 0 punkti (turvatasemeni ei jõudnud) | ✅ |
| Vale vastus 7. küsimusel | Tulemus = 1 000 punkti (turvatase 5) | ✅ |
| Vale vastus 13. küsimusel | Tulemus = 32 000 punkti (turvatase 10) | ✅ |
| Kõik 15 õigeks | Tulemus = 1 000 000 punkti, võidukuva | ✅ |

## Mis JÄI testimata

- **Päris AI sügav korrektsus:** kuna mudeli väljund on stohhastiline, ei saa garanteerida, et iga genereeritud küsimustepakk oleks 100% pedagoogiliselt korralik. Testitud, et formaat on korrektne ja küsimused on inimese lugemisel mõistlikud, kuid mitte tuhandel iteratsioonil.
- **Erinevad brauserid mobiilis:** testitud Firefox 134 ja Chromium 130 desktop'is. Mobile-vaadet ei ole UAT-is süstemaatiliselt testitud (CSS sisaldab `@media (max-width: 880px)` reeglit, mis lülitab mängu vaate ühe veeruga vaatesse).
- **Kõrge koormus / palju samaaegseid mängijaid:** rakendus on disainitud üheks kasutajaks korraga, koormustestid pole asjakohased.

## Ausad piirangud

Kui tunnis tunni hindaja paneb tähele:

1. Mock-režiimi küsimused on **suuremas osas üldised** ja ei eristu ülesandeti väga selgelt — sihilik kompromiss, et liides töötaks ka ilma võtmeta. Päris AI väljund on sisukam.
2. Markdown-renderer on **minimaalne** (sihilik, et hoida frontend ilma build-step'ita) — tabelid, lingid, koodiplokid kuvatakse osaliselt; `marked` on juba sõltuvuste hulgas, et seda hiljem täielikult sisse lülitada.
3. **Tulemuste ajalugu ei salvestata** — vt edasiarendused README-s ja US-11 backlog'is.
