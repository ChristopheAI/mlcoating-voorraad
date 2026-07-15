# ML Coating Voorraad

Praktische **voorraadapp voor poedercoating** op de werkvloer.

> **Live demo (fictieve data):** https://app-production-32db.up.railway.app  
> Portfolio: https://vastpakt.be

## Status

- In **dagelijks gebruik** bij het poedercoating-bedrijf (productie-deploy is privé)
- Publieke **demo** op Railway met seed-data en demo-logins (geen klantdata)
- Deze repo is de **UI / app-code** (Next.js) zoals die in de publieke showcase hoort

## Wat het oplost

Op de vloer moet voorraad snel en correct aangepast kunnen worden zonder zwaar ERP:

- Voorraad per RAL-kleur, laktype en merk
- Stock in, verbruik uit, correcties met spoor
- Rollen (admin / operator) in de productie-setup
- Focus: snelheid op tablet/werkvloer

## Cijfers (productie, publiek genoemd)

- 135 voorraadregels  
- ±1.822 kg poeder in beheer  
- Eerste versie → dagelijks gebruik in weken; **ruim een jaar** in gebruik  

## Stack (deze repo)

- Next.js · React · TypeScript · Tailwind  

Productie draait met aparte backend/database-deploy (niet alles staat in deze public snapshot). De **demo** is de bedoelde klikbare showcase.

## Lokaal

```bash
npm install
npm run dev
```

## Note

Klantproductie en echte data blijven privé. Publiek alleen demo + deze codebase-showcase.
