# JSON-andmete kuvamine

## Eesmärk

Luua leht, mis loeb kohaliku JSON-faili ning kuvab selle andmed loetava nimekirjana.

## Nõuded

- Andmed asuvad failis `src/data.json` ja sisaldavad raamatute nimekirja (pealkiri, autor, aasta).
- Lehte laadides loetakse JSON ja kuvatakse iga raamat eraldi kaardina.
- Kasutatakse `fetch()` API-d, mitte `XMLHttpRequest`-i.
- Vea korral (näiteks fail puudub) kuvatakse kasutajale arusaadav teade.
- HTML, CSS ja JS on eraldi failides kaustas `src/`.

## Hindamiskriteeriumid

- Andmed kuvatakse korrektselt.
- Vea käsitlus on olemas.
- Kood kasutab moodsaid JS-funktsioone (`async/await` või `.then()`).
