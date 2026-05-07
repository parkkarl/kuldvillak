# To-do nimekiri localStorage'iga

## Eesmärk

Luua veebipõhine ülesannete nimekiri, mille sisu püsib brauseri taaskäivitamise järel.

## Nõuded

- Kasutaja saab lisada uue ülesande tekstivälja kaudu.
- Iga ülesannet saab linnukesega märkida tehtuks.
- Iga ülesannet saab kustutada.
- Andmed salvestatakse `localStorage`-isse võtme `todos` all.
- Lehe avamisel laetakse olemasolevad ülesanded automaatselt.
- Tühja sisendi lisamist ei lubata.

## Hindamiskriteeriumid

- localStorage'i kasutus on korrektne (JSON serialiseerimine ja deserialiseerimine).
- Tühja teksti ei saa lisada.
- Kustutamine eemaldab kirje nii ekraanilt kui ka localStorage'ist.
- Kood on ühes failis lihtsuse mõttes (`script.js`), aga loogiliselt funktsioonideks jaotatud.

## Teadaolev piirang

Praegune lahendus kasutab `innerHTML`-i, et lisada uued read — see eeldab, et sisend oleks juba puhastatud või et seda kontrollitaks edasi.
