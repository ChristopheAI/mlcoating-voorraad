// Nieuwe naam volgens de UX-richtlijnen
export type PoederDoos = {
  id: number; // Intern ID voor React keys en mutaties (niet zichtbaar voor gebruiker)
  ral_kleur: string;
  laktype: string;
  merk: string;
  gewicht: number; // standaard 20kg
  aantal_dozen: number;
  aantal_gebruikt: number; // nieuw veld om bij te houden welke deels gebruikt zijn
  vervaldatum?: string;
};


// Type voor het bijhouden van een verbruiksactie voor undo-functionaliteit
export type VerbruiksActie = {
  itemId: number;
  vorigeStatus: PoederDoos;
  timestamp: number;
  type: string; // 'kwart', 'half', 'driekwart', 'leeg' of 'custom'
  hoeveelheid?: number; // alleen voor custom type
};

// Geschiedenis van acties bijhouden (maximaal 10)
let verbruiksGeschiedenis: VerbruiksActie[] = [];
const MAX_GESCHIEDENIS = 10;

// Maak een gemuteerde array om nieuwe items toe te kunnen voegen
let voorraadData: PoederDoos[] = [
  { id: 1, ral_kleur: "9016", laktype: "mat", merk: "Protech", gewicht: 100, aantal_dozen: 5, aantal_gebruikt: 0, vervaldatum: "2025-12-31" },
  { id: 2, ral_kleur: "9005", laktype: "glans", merk: "Tiger", gewicht: 40, aantal_dozen: 2, aantal_gebruikt: 0 },
  { id: 3, ral_kleur: "7016", laktype: "structuur", merk: "Sherwin-Williams", gewicht: 160, aantal_dozen: 8, aantal_gebruikt: 0, vervaldatum: "2026-01-15" },
  { id: 4, ral_kleur: "9001", laktype: "mat", merk: "Sherwin-Williams", gewicht: 120, aantal_dozen: 6, aantal_gebruikt: 0 },
  // Vervang potentieel dubbele items met unieke waarden
  { id: 5, ral_kleur: "9016", laktype: "glans", merk: "Protech", gewicht: 80, aantal_dozen: 4, aantal_gebruikt: 0 },
];

// Verwijder een doos op basis van ID
export const verwijderVoorraadItem = (id: number): PoederDoos[] => {
  voorraadData = voorraadData.filter(item => item.id !== id);
  saveToLocalStorage();
  return voorraadData;
};

// Getter voor de geschiedenis
export const getVerbruiksGeschiedenis = () => verbruiksGeschiedenis;

// Helper functie om een actie toe te voegen aan de geschiedenis
const voegActieToeAanGeschiedenis = (actie: VerbruiksActie) => {
  verbruiksGeschiedenis = [actie, ...verbruiksGeschiedenis.slice(0, MAX_GESCHIEDENIS - 1)];
  saveToLocalStorage();
};

// Functie om de laatste verbruiksactie ongedaan te maken
export const undoLaatsteVerbruik = (): PoederDoos | null => {
  if (verbruiksGeschiedenis.length === 0) return null;
  
  // Haal de laatste actie uit de geschiedenis
  const laatsteActie = verbruiksGeschiedenis[0];
  verbruiksGeschiedenis = verbruiksGeschiedenis.slice(1);
  
  // Zoek het item in de huidige voorraad
  const itemIndex = voorraadData.findIndex(item => item.id === laatsteActie.itemId);
  if (itemIndex === -1) return null;
  
  // Herstel de vorige status
  voorraadData = [
    ...voorraadData.slice(0, itemIndex),
    laatsteActie.vorigeStatus,
    ...voorraadData.slice(itemIndex + 1)
  ];
  
  saveToLocalStorage();
  return laatsteActie.vorigeStatus;
};

// Functie om data op te slaan in localStorage
const saveToLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('poederdozen', JSON.stringify(voorraadData));
      localStorage.setItem('poederdozen_geschiedenis', JSON.stringify(verbruiksGeschiedenis));
    } catch (error) {
      console.error('Fout bij opslaan naar localStorage:', error);
    }
  }
};

// Functie om data te laden uit localStorage
export const loadFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem('poederdozen');
      if (storedData) {
        voorraadData = JSON.parse(storedData);
      }
      
      const storedGeschiedenis = localStorage.getItem('poederdozen_geschiedenis');
      if (storedGeschiedenis) {
        verbruiksGeschiedenis = JSON.parse(storedGeschiedenis);
      }
    } catch (error) {
      console.error('Fout bij laden uit localStorage:', error);
    }
  }
};

// Laad data uit localStorage bij initialisatie
if (typeof window !== 'undefined') {
  loadFromLocalStorage();
}

// Getter voor de voorraad data
export const voorraad = () => voorraadData;

// Functie om een nieuw item toe te voegen
export const voegVoorraadItemToe = (item: Omit<PoederDoos, "id" | "gewicht" | "aantal_gebruikt">) => {
  // Genereer een nieuw ID (hoogste ID + 1)
  const newId = Math.max(0, ...voorraadData.map(item => item.id)) + 1;
  
  // Voeg het nieuwe item toe aan de array
  const newItem: PoederDoos = {
    id: newId,
    gewicht: item.aantal_dozen * 20, // Bereken gewicht op basis van aantal dozen
    aantal_gebruikt: 0, // Begin met 0 gebruikte dozen
    ...item
  };
  
  voorraadData = [...voorraadData, newItem];
  saveToLocalStorage();
  return newItem;
};

// Functie om voorraad te verminderen (verbruik) op basis van vooraf ingestelde hoeveelheden of custom gewicht
export const verbruikVoorraad = (id: number, hoeveelheid: string): PoederDoos | null => {
  // Check of dit een custom hoeveelheid is (gewicht in kg)
  if (hoeveelheid.startsWith('custom:')) {
    const gewichtInKg = parseFloat(hoeveelheid.replace('custom:', ''));
    if (!isNaN(gewichtInKg) && gewichtInKg > 0) {
      // Gebruik direct gewicht in kg voor custom verbruik
      return verbruikCustomHoeveelheid(id, gewichtInKg);
    }
    return null;
  }
  
  // Zoek het item
  const itemIndex = voorraadData.findIndex(item => item.id === id);
  if (itemIndex === -1) return null;

  const item = voorraadData[itemIndex];
  // Bewaar de huidige staat voor undo-functionaliteit
  const vorigeStatus = {...item};

  // Bereken nieuwe voorraad op basis van verbruik
  let nieuweDozen = item.aantal_dozen;
  let nieuweGebruik = item.aantal_gebruikt;

  if (hoeveelheid === "kwart") {
    nieuweGebruik += 0.25;
  } else if (hoeveelheid === "half") {
    nieuweGebruik += 0.5;
  } else if (hoeveelheid === "driekwart") {
    nieuweGebruik += 0.75;
  } else if (hoeveelheid === "leeg") {
    nieuweDozen--;
  }

  // Als we een hele doos gebruikt hebben
  if (nieuweGebruik >= 1) {
    nieuweDozen--;
    nieuweGebruik = 0;
  }

  // Update het item in de voorraad
  const updatedItem = {
    ...item,
    aantal_dozen: nieuweDozen,
    aantal_gebruikt: nieuweGebruik
  };

  voorraadData = [
    ...voorraadData.slice(0, itemIndex),
    updatedItem,
    ...voorraadData.slice(itemIndex + 1)
  ];

  // Voeg actie toe aan geschiedenis
  voegActieToeAanGeschiedenis({
    itemId: id,
    vorigeStatus,
    timestamp: Date.now(),
    type: hoeveelheid
  });

  saveToLocalStorage();
  return updatedItem;
};

// Functie om een custom hoeveelheid te verbruiken
export const verbruikCustomHoeveelheid = (id: number, hoeveelheid: number): PoederDoos | null => {
  const itemIndex = voorraadData.findIndex(item => item.id === id);
  if (itemIndex === -1) return null;
  
  const item = voorraadData[itemIndex];
  
  // Sla de originele status op voor undo
  const origineleStatus: PoederDoos = { ...item };
  
  // Bereken hoeveel er overblijft na het verbruik (in kg)
  // Huidig gewicht = aantal dozen * 20kg + eventuele rest van deels gebruikte doos
  const volleDozijnGewicht = item.aantal_dozen * 20;
  const deelsGebruiktGewicht = item.aantal_gebruikt > 0 ? (1 - item.aantal_gebruikt) * 20 : 0;
  const huidigeGewicht = volleDozijnGewicht + deelsGebruiktGewicht;
  
  // Bereken nieuw gewicht na verbruik
  const nieuwGewicht = Math.max(0, huidigeGewicht - hoeveelheid);
  
  // Bereken het aantal hele dozen
  const nieuweAantal = Math.floor(nieuwGewicht / 20);
  
  // Bereken hoeveel er gebruikt is van de laatste doos (als er een gedeeltelijke doos is)
  // Als er een restwaarde is (nieuwGewicht % 20), dan is er een gedeeltelijke doos
  // De waarde van nieuweGebruikt moet aangeven hoeveel er GEBRUIKT is (niet hoeveel er over is)
  const restGewicht = nieuwGewicht % 20;
  const nieuweGebruikt = restGewicht > 0 ? ((20 - restGewicht) / 20) : 0;
  
  // Update het item
  const updatedItem: PoederDoos = {
    ...item,
    gewicht: nieuwGewicht,
    aantal_dozen: nieuweAantal,
    aantal_gebruikt: nieuweGebruikt
  };
  
  // Update de array
  voorraadData = [
    ...voorraadData.slice(0, itemIndex),
    updatedItem,
    ...voorraadData.slice(itemIndex + 1)
  ];
  
  // Voeg de actie toe aan de geschiedenis
  voegActieToeAanGeschiedenis({
    itemId: id,
    vorigeStatus: origineleStatus,
    timestamp: Date.now(),
    type: 'custom',
    hoeveelheid: hoeveelheid
  });
  
  saveToLocalStorage();
  return updatedItem;
};
