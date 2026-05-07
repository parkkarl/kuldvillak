# Definition of Done

Lugu (kasutajalugu) loetakse **valmis (Done)**, kui *kõik* allolevad punktid on täidetud.

## Üldine

1. **Vastuvõtutingimused** kasutajaloos on kõik märgitud täidetuks (vt `docs/BACKLOG.md`).
2. Funktsionaalsust on **manuaalselt testitud** — käsitsi, brauseris või curl'iga, sõltuvalt loost. Tulemus on dokumenteeritud `docs/TESTING.md`-s.
3. **Git'is on commit**, mille sõnum viitab loo numbrile (`US-3: ...`).
4. **README** ja muu dokumentatsioon on uuendatud, kui lugu mõjutas kasutajat puudutavat käitumist.
5. Lugu **ei ole katki teinud** ühtegi varem täidetud kasutajalugu (regressioonikontroll käsitsi).

## Koodi kvaliteet

6. Kood **käivitub veaolukorrata** `npm start` käsuga.
7. Konsool ei viska **brauseris ega serveris** ootamatuid vigu standardse kasutusvoo ajal.
8. **Vastutusalad on hajutatud** — küsimuste genereerimine (`src/aiClient.js`), failide lugemine (`src/fileReader.js`), HTTP-marsruudid (`server.js`) ja UI (`public/`) on eraldi failides. Ükski neist ei ületa ~400 rida.
9. **Salajaseid andmeid** (API võtit) ei ole commit'itud — `.env` on `.gitignore`-is.

## Dokumentatsioon

10. **README sisaldab käivitamise juhendit**, mis töötab puhtal masinal alates `npm install`-ist.
11. **Iga muudatus, mis mõjutab kausta `input/` struktuuri**, on dokumenteeritud README-s.
12. **AI promptid** on käibel kasutatud kujul saadaval `prompts/`-s.

## Mis EI kuulu DoD alla (sihilikult)

- Automaatsed unit-testid — projekt on demonstratiivne ja TAK25 lähteülesanne ei nõua testpaketti. UAT (vastuvõtu­tingimuste käsitsi-test) on dokumenteeritud `docs/TESTING.md`-s.
- CI/CD — projekt on lokaalne, ühe arendaja oma.
- Production-kõlblik error handling — vt teadaolevad piirangud README-s.
