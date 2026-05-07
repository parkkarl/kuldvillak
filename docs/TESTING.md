# Testimise tulemused (UAT)

Iga kasutajalugu testiti käsitsi vastuvõtutingimuste alusel. Allpool on tulemused.

**Keskkond:** Linux 6.19 (Fedora 43), Node.js 20.x, Firefox/Chromium.
**Kuupäev:** 2026-05-07.

| ID | Lugu | Status | Märkused |
|----|------|--------|----------|
| US-1 | Ülesannete nimekiri | ✅ PASS | `input/001`, `input/002`, `input/003` ilmuvad õigete pealkirjadega; iga ülesande juures kuvatakse panga suurus (53/50/50). Tühja `input/` puhul kuvatakse arusaadav teade. |
| US-2 | Ülesande valimine | ✅ PASS | Kõikide kolme näidise `assignment.md` renderdub korrektselt; failide arv ja panga suurus on `taskFiles`-i tekstis. |
| US-3 | Eelgenereeritud küsimustepank | ✅ PASS | `loadBank` + `pickFifteen`: igale 15 raskuse-tasemele leitakse vähemalt üks kandidaat. Validatsioon (level 1-15, 4 varianti, valid correctIndex, explanation) jookseb käivitusel. |
| US-4 | Mängu kulg | ✅ PASS | 15 küsimust, õige vastus = edasi, vale = mäng lõppeb. Punktiastmed (100…1 000 000) ja turvatasemed (5./10./15.) õiged. |
| US-5 | Selgitus | ✅ PASS | Kuvatakse pärast iga vastust ja ka lõpukuvas iga küsimuse juures. |
| US-6 | Tulemus | ✅ PASS | Lõplik punktisumma vastab turvataseme reeglile (0 / 1 000 / 32 000 / 1 000 000). „Mängi uuesti" ja „Tagasi nimekirja" töötavad. |
| US-7 | Pooleli jätmine | ✅ PASS | Kinnitusdialoog ilmub, lahkumine viib lõpukuvale viimase õigesti vastatud küsimuse punktisummaga. |
| US-8 | Õpetaja lisab ülesande | ✅ PASS | Lisasin testimiseks ajutise `input/099` koos `assignment.md` ja `questions.json`-iga — ilmus kohe nimekirja, ilma serveri taaskäivitamiseta. |
| US-9 | Õlekõrred (50:50, publik) | ✅ PASS | 50:50 eemaldab kaks valet varianti; publik kuvab tulpdiagrammi (lihtsamatel küsimustel saab õige vastus suurema osakaalu). Iga õlekõrt saab kasutada kord. |
| US-10 | Variatsioon iga mängu vahel | ✅ PASS | Kahe järjestikuse mängu vahel kattus keskmiselt 5 küsimust 15-st (33%) → variatsioon piisav „iga kord vähemalt osaliselt uued" nõude jaoks. Variantide järjekord segati lisaks. |

## Käsitsi-test (curl)

```bash
# 1) Ülesannete loend (sisaldab bankSize-i)
curl -s http://localhost:3000/api/tasks | jq
# → tasks: [{id:001,bankSize:53}, {id:002,bankSize:50}, {id:003,bankSize:50}]

# 2) Ülesande detail
curl -s http://localhost:3000/api/tasks/001 | jq '.title, .bankSize, (.files | length)'
# → "JavaScripti kalkulaator", 53, 5

# 3) Küsimuste valimine pankast
curl -s -X POST http://localhost:3000/api/tasks/001/questions \
  | jq '{count: (.questions | length), levels: [.questions[].level]}'
# → {"count": 15, "levels": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]}
```

## Edge case'id

| Stsenaarium | Oodatud käitumine | Tulemus |
|-------------|------------------|---------|
| `input/` ei eksisteeri | Tühi nimekiri + selgitus | ✅ |
| Numbri-mitte alamkaust (näiteks `input/abc/`) | Ignoreeritakse | ✅ |
| Ülesande kaust ilma `questions.json`-ita | API tagastab 500 koos selge sõnumiga | ✅ |
| Pank, mille mõnel raskusel pole ühtegi küsimust | API tagastab 500 koos viitega: „Pank ei sisalda ühtegi küsimust raskusele X" | ✅ |
| Pank vigase JSON-iga | API tagastab 500, vea tekst sisaldab JSON.parse-i sõnumit | ✅ |
| Mäng ilma õlekõrt kasutamata | 15 küsimust läbi, kõik töötab | ✅ |
| Vale vastus 1. küsimusel | Tulemus = 0 punkti (turvatasemeni ei jõudnud) | ✅ |
| Vale vastus 7. küsimusel | Tulemus = 1 000 punkti (turvatase 5) | ✅ |
| Vale vastus 13. küsimusel | Tulemus = 32 000 punkti (turvatase 10) | ✅ |
| Kõik 15 õigeks | Tulemus = 1 000 000 punkti, võidukuva | ✅ |
| Variantide järjekord segatud | Iga mäng — sama küsimuse korral tähekohad muutuvad | ✅ |

## Mis JÄI testimata

- **Pankade pedagoogiline täpsus on 100% korras:** lugesin kõik 153 küsimust üle, aga „kas iga selgitus on parim võimalik" ei pruugi olla kuldne tõde — mõnda küsimust saaks parandada (näiteks rohkem distractoreid, paremat keelt). Iteratiivne parandamine kuulub edasiarendusse.
- **Erinevad brauserid mobiilis:** testitud Firefox 134 ja Chromium 130 desktop'is. Mobile-vaadet ei ole UAT-is süstemaatiliselt testitud (CSS sisaldab `@media (max-width: 880px)` reeglit, mis lülitab mängu vaate ühe veeruga vaatesse).
- **Kõrge koormus:** rakendus on disainitud üheks kasutajaks korraga, koormustestid pole asjakohased.
- **A11Y audit:** silt-värvide kontrast ja klaviatuurinavigeerimine on jäetud edasiarendusse.

## Ausad piirangud

1. **Pole päris AI** — küsimused on eelgenereeritud arenduskeskkonnas (Claude'iga). Hindajaks tähendab see, et samal pangas on alati samad küsimused (lihtsalt erineva järjekorraga ja segatud variantidega). Pikemas perspektiivis (mängija mängib 30+ korda) muutuvad kordused märgatavaks. Vt README → „Edasiarenduse võimalused".
2. **Markdown-renderer on minimaalne** — sihilik, et hoida frontend ilma build-step'ita.
3. **Tulemuste ajalugu ei salvestata** — vt US-11 backlog'is.
4. **Disainimuudatus mid-projekt:** algselt oli runtime AI (US-3), katsetati Claude CLI integratsiooni Hetzneri serveris, lõplikuks valikuks osutus eelgenereeritud pank (vt BACKLOG.md „Disainimuudatus mid-projekt").
