# ML Coating Voorraad

Praktische voorraadapp voor poedercoating op de werkvloer.

## Status

Actief project. Draaiende deployment:
- https://mlcoatingbackend-production.up.railway.app/

## Wat dit project oplost

Op de vloer moet voorraad snel en correct aangepast kunnen worden zonder complexe ERP-flow.
Deze app focust op snelheid en eenvoud:
- Voorraad bekijken per RAL-kleur, laktype en merk
- Nieuwe voorraad toevoegen via compact formulier
- Verbruik registreren (in kg of gedeeltelijke doos)
- Historiek en undo voor recente verbruiksacties
- Zoeken/filteren op kleur en merk

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Client-side opslag via `localStorage`

## Belangrijke implementatiedetails

- Domeinmodel rond `PoederDoos` met velden voor dozen, gewicht en deels gebruikt
- Verbruik ondersteunt kwart/half/driekwart/leeg en custom kg
- Undo-mechanisme met beperkte geschiedenis voor veilige correcties
- Productflow geoptimaliseerd voor tablet/workfloor-gebruik

## Lokaal draaien

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

## Roadmap

- API + database (persistent multi-user data)
- Auth en rollen
- Rapportage/export flow
- Audit trail

## Repository

https://github.com/ChristopheAI/mlcoating-voorraad
