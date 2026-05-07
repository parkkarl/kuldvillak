# Planeerimise dokument

## Sprint 0 — Eeltöö (planeerimine)

**Kuupäev:** 2026-05-07 (enne arendamist)

### Eesmärk

Otsustada, mis tehnoloogiad valida, milline on minimaalne MVP, ja kuidas tööd jagada nii, et **iga vahepunktis** oleks rakendus käivitatav.

### Otsused

1. **Tehnoloogia: Node.js + Express + vanilla frontend.**
   *Põhjus:* lähteülesanne on väike, raamistik (React/Vue) ei lisa väärtust. Express on paindlik failide lugemiseks ja AI päringuks. Vanilla JS hoiab build-step'i nullis ja lasi keskenduda mängu loogikale.
2. **AI: Anthropic Claude SDK ametliku paketiga.**
   *Põhjus:* see on Claude'i jaoks lihtsaim ja kõige paremini dokumenteeritud variant; instructori antud miinimum nõuab AI-prompti dokumenteerimist, mitte konkreetset pakkujat.
3. **Mock-režiim sisseehitatuna juba MVP-s.**
   *Põhjus:* hindaja ei pruugi tahta enda võtit kasutada; pidi olema demoreaelne ka offline.
4. **Iga ülesande puhul saadetakse AI-le KOGU ülesande kontekst** (assignment.md + tugifailid kuni 800 kB), mitte ainult faili­nimed.
   *Põhjus:* küsimused peavad olema sisulised, mitte lihtsalt "mis oli faili nimi?"
5. **Frontend ühel lehel ilma router'ita** — vaheldumisi täidetakse `<main id="app">` vastava `<template>`-iga.
   *Põhjus:* hoiab koodi väiksena ja ei lisa raamistiku-laadset keerukust.
6. **Failide lugemine TextExtension-allowlist'iga.**
   *Põhjus:* binaarfaile (pildid, fontid) AI-le saata pole mõtet ja need rikuvad konteksti.

### Tööjärjekord (Sprint 1, 2 päeva eelarve)

| Etapp | Lugu (vt BACKLOG.md) | Kestus |
|-------|----------------------|--------|
| 1 | Projekti struktuur, package.json, .gitignore | 0.5 h |
| 2 | `fileReader.js` + `GET /api/tasks`, `GET /api/tasks/:id` (US-1, US-2) | 1.5 h |
| 3 | `aiClient.js` mock-režiimiga (US-3 osaliselt) | 1 h |
| 4 | Anthropic SDK integratsioon ja prompt (US-3 lõpetamine) | 1 h |
| 5 | Frontend — ülesannete nimekiri ja detail (US-1, US-2 UI) | 1.5 h |
| 6 | Frontend — mängu vaade (US-4) | 2 h |
| 7 | Selgitus + tulemus + uuesti mängimine (US-5, US-6, US-7) | 1 h |
| 8 | 3 näidisülesannet `input/` kausta (US-8 testimiseks) | 0.5 h |
| 9 | Õlekõrred (US-9, sprint 2) | 1 h |
| 10 | README, BACKLOG, DoD, TESTING (kogu dokumentatsioon) | 1 h |
| 11 | UAT testimine ja parandused | 0.5 h |
| **Kokku** | | **~11.5 h** |

### Riskide haldus

| Risk | Mõju | Leevendus |
|------|------|-----------|
| AI tagastab vigase JSON-i | Mängu ei saa alustada | `extractJson` parser, valideerimine, vea kuvamine UI-s |
| API võti puudub | Demo ei käivitu | Sisseehitatud mock-režiim |
| Suur lahendus (palju faile) ületab konteksti | AI ei saa täielikku pilti | 800 kB hard limit `fileReader.js`-s, kärbitud failidele märk |
| Kasutaja koondub mängust → kaotab progressi | UX kaotus | Pooleli jätmise nupp + kinnitusdialoog |

## Sprint 1 retrospektiiv (täidetakse pärast esitamist)

### Mis õnnestus

- MVP käivitub puhtalt `npm install && npm start`-iga.
- Mock-režiim töötab — terve mängu sai läbi mängida ka ilma võtmeta.
- Failide lugemise eraldatus AI-st andis võimaluse vahetada ühte ilma teist puudutamata.

### Mis oli keeruline

- AI vastusest puhta JSON-i parsimine — mudelid panevad vahel ümber selgitusi. Lahendati `[`...`]` brackettide järgi parsimisega, mis on tolerantsem.
- Õige tasakaal raskusastmete vahel — testides selgus, et level 11–15 küsimused olid mock-režiimis liiga sarnased; vajab tegelikku AI-d, et õigesti hinnata.

### Mida järgmises iteratsioonis parandada

- Lisada vahemälu, et sama ülesande sama versiooni puhul ei tarvitseks alati AI-d uuesti kutsuda (vt US-12).
- Tulemuste salvestamine (US-11) — praegu unustab kõik mängu lõpul.
- Markdown render praeguses minimaalses lahenduses ei toeta tabeleid ega koodi süntaksivärvi — `marked` on juba `package.json`-is, aga frontendis pole sisse lülitatud.
