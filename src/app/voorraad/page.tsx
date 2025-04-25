"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from 'next/link';
import { voorraad, PoederDoos, verbruikCustomHoeveelheid, verwijderVoorraadItem } from '@/lib/data';
import { Modal } from './modal';
import { sorteerOpRAL } from '@/lib/sort';

// De cardview is ontworpen met focus op gemakkelijke visuele herkenning
import { getVerbruiksGeschiedenis } from '@/lib/data';

function HistoriekVerbruik({ itemId }: { itemId: number }) {
  // Haal de laatste 3 verbruiksacties voor dit item op
  const acties = getVerbruiksGeschiedenis()
    .filter((a) => a.itemId === itemId)
    .slice(0, 3);
  if (acties.length === 0) {
    return <div className="mt-2 text-xs text-gray-400">Nog geen verbruik geregistreerd.</div>;
  }
  return (
    <div className="mt-2 text-xs text-gray-600">
      <div className="font-semibold text-gray-500 mb-1">Laatste verbruik:</div>
      <ul className="space-y-1">
        {acties.map((actie, i) => {
          const datum = new Date(actie.timestamp).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
          let hoeveelStr = '';
          if (actie.type === 'custom' && actie.hoeveelheid) {
            hoeveelStr = `${actie.hoeveelheid.toFixed(2)} kg`;
          } else if (actie.type === 'kwart') {
            hoeveelStr = '5.00 kg';
          } else if (actie.type === 'half') {
            hoeveelStr = '10.00 kg';
          } else if (actie.type === 'driekwart') {
            hoeveelStr = '15.00 kg';
          } else if (actie.type === 'leeg') {
            hoeveelStr = '20.00 kg';
          }
          return <li key={i} className="flex items-center gap-2"><span className="text-gray-500">{datum}</span><span className="">{hoeveelStr}</span></li>;
        })}
      </ul>
    </div>
  );
}

export default function CardViewPage() {
  // Server-side rendering kan problemen veroorzaken met hydration,
  // dus we laden de data alleen aan client-side
  const [voorraadItems, setVoorraadItems] = useState<PoederDoos[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [geselecteerdItem, setGeselecteerdItem] = useState<PoederDoos | null>(null);
  const [verbruiksHoeveelheid, setVerbruiksHoeveelheid] = useState("kwart"); // standaard kwart doos
  
  // Gebruik useEffect om data alleen client-side te laden
  useEffect(() => {
    setVoorraadItems(voorraad());
  }, []);
  const [zoekTekst, setZoekTekst] = useState('');
  const [filterMerk, setFilterMerk] = useState('alle');
  
  // Functie om verbruiksmodal te openen
  const openVerbruiksModal = (item: PoederDoos) => {
    setGeselecteerdItem(item);
    // Bepaal het actuele gewicht (inclusief deels gebruikte doos)
    const actueleGewicht = (item.aantal_dozen * 20) + (item.aantal_gebruikt > 0 ? (1 - item.aantal_gebruikt) * 20 : 0);
    setBeginGewicht(actueleGewicht);
    setModalOpen(true);
  };
  
  // States voor het weegschaalproces
  const [beginGewicht, setBeginGewicht] = useState<number | null>(null);
  const [eindGewicht, setEindGewicht] = useState<number | null>(null);
  const [customHoeveelheid, setCustomHoeveelheid] = useState<number>(0);
  const [directeInvoer, setDirecteInvoer] = useState<boolean>(false);
  
  // Functie om verbruik te registreren
  const handleVerbruikRegistreren = () => {
    console.log('handleVerbruikRegistreren called', {directeInvoer, customHoeveelheid, beginGewicht, eindGewicht, geselecteerdItem});
    if (geselecteerdItem) {
      let resultaat: PoederDoos | null = null;
      if (geselecteerdItem.aantal_dozen > 1) {
        // Registratie voor meerdere dozen
        if (customHoeveelheid > 0.01) {
          resultaat = verbruikCustomHoeveelheid(geselecteerdItem.id, customHoeveelheid);
        }
      } else if (directeInvoer) {
        // Direct kg invoer
        const kg = Number(customHoeveelheid);
        if (kg > 0.01) {
          resultaat = verbruikCustomHoeveelheid(geselecteerdItem.id, kg);
        }
      } else {
        // Verschil begin- en eindgewicht
        if (beginGewicht !== null && eindGewicht !== null) {
          const verschil = beginGewicht - eindGewicht;
          if (verschil > 0.01) {
            resultaat = verbruikCustomHoeveelheid(geselecteerdItem.id, verschil);
          }
        }
      }
      if (resultaat) {
        setVoorraadItems(voorraad());
        alert('Verbruik succesvol geregistreerd!');
        setModalOpen(false);
        setBeginGewicht(null);
        setEindGewicht(null);
        setCustomHoeveelheid(0);
      } else {
        alert('Er ging iets mis bij het registreren van verbruik.');
      }
    }
  };
  
  // Vooraf gedefinieerde RAL kleuren met hex codes voor visuele weergave
  const ralKleuren = {
    "9016": "#F6F6F6", // Verkeerswit
    "9010": "#FFFFFF", // Zuiver wit
    "9005": "#0A0A0A", // Gitzwart
    "7016": "#293133", // Antracietgrijs
    "3000": "#AF2B1E", // Vuurrood
    "5010": "#0E294B", // Gentiaanblauw
    "6005": "#2F4538", // Mosgroen
    "9001": "#FDF4E3"  // Crèmewit
  };
  
  // Helper functie om hex code te vinden voor RAL kleur
  const getRalKleurHex = (ralKleur: string) => {
    // Zoek naar RAL nummer in de string
    for (const [code, hex] of Object.entries(ralKleuren)) {
      if (ralKleur.includes(code)) return hex;
    }
    return "#CCCCCC"; // Standaard grijs als niet gevonden
  };
  
  // Groepeer items per RAL/type combinatie voor visuele weergave
  const gegroepeerdeItems = useMemo(() => {
    // Eerst filteren we de items
    const gefilterd = voorraadItems.filter(item => {
      // Zoektekst filter
      if (zoekTekst && !item.ral_kleur.toLowerCase().includes(zoekTekst.toLowerCase())) {
        return false;
      }
      
      // Merk filter
      if (filterMerk !== 'alle' && item.merk !== filterMerk) {
        return false;
      }
      
      return true;
    });
    
    // Groepeer per RAL + Laktype + Merk + ID (voor gegarandeerd unieke keys)
    const groepering: Record<string, PoederDoos[]> = {};
    gefilterd.forEach(item => {
      // Voeg item.id toe voor absolute unieke keys
      const key = `${item.ral_kleur}-${item.laktype}-${item.merk}`;
      if (!groepering[key]) {
        groepering[key] = [];
      }
      groepering[key].push(item);
    });
    
    return groepering;
  }, [voorraadItems, zoekTekst, filterMerk]);

  // Alle merken ophalen voor de filteropties
  const beschikbareMerken = useMemo(() => {
    return ['alle', ...Array.from(new Set(voorraadItems.map(item => item.merk)))];
  }, [voorraadItems]);
  
  return (
    <main className="max-w-6xl mx-auto p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Voorraad Poederdozen</h1>
          <p className="text-gray-600 mt-1">{voorraadItems.length} kleuren • {voorraadItems.reduce((sum, item) => sum + item.aantal_dozen, 0)} dozen</p>
        </div>
        
        {/* Snelle acties - rechts uitgelijnd */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <Link 
            href="/voorraad/nieuw" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl text-center font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Nieuwe doos
          </Link>
          <button 
            onClick={() => {}} 
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-5 rounded-xl font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV Export
          </button>
        </div>
      </header>
      
      {/* Verbeterde zoekbalk met visuele feedback */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Zoek op RAL nummer of kleur..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
          value={zoekTekst}
          onChange={(e) => setZoekTekst(e.target.value)}
        />
        {zoekTekst && (
          <button 
            onClick={() => setZoekTekst('')}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Filter op merk - visueel met logo's */}
      <div className="bg-white shadow-md rounded-2xl p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Filter op merk
        </h3>
        <div className="flex flex-wrap gap-2">
          {beschikbareMerken.map(merk => (
            <button
              key={merk}
              onClick={() => setFilterMerk(merk)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterMerk === merk 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-1'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {merk === 'alle' ? 'Alle merken' : merk}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lijstweergave */}
      {/* Header voor de lijst */}
      <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_100px_120px] gap-4 px-4 py-2 mb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase"> 
        <div>RAL Kleur / Laktype / Merk</div> 
        <div className="text-right">Aantal Dozen</div> 
        <div className="text-right">Gewicht (kg)</div> 
        <div className="text-right">Status</div> 
        <div>Acties</div> 
      </div> 
      
      <div className="flex flex-col gap-6"> {/* Gewijzigd naar flex-col */}
        {Object.entries(gegroepeerdeItems)
          .sort(([keyA], [keyB]) => sorteerOpRAL(keyA) - sorteerOpRAL(keyB))
          .map(([key, items]) => {
          const [ral, laktype] = key.split('-');
          const totaleDoosBedrag = items.reduce((sum, item) => sum + item.aantal_dozen, 0);
          const hasLowStock = totaleDoosBedrag < 3;
          const isGitzwart = ral === '9005';
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-fadeIn">
              {/* Header voor de RAL-groep */}
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-md" 
                    style={{ backgroundColor: getRalKleurHex(ral) }}
                  ></div>
                  <div>
                    <h3 className="text-lg font-bold">RAL {ral}</h3>
                    <div className="text-sm text-gray-500 capitalize">{laktype}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Totaal</div>
                  <div className="text-xl font-bold">{totaleDoosBedrag} {totaleDoosBedrag === 1 ? 'doos' : 'dozen'}</div>
                  {hasLowStock && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block">
                      Lage voorraad
                    </span>
                  )}
                </div>
              </div>

              {/* Lijst van dozen binnen deze groep */}
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-[1fr_100px_100px_100px_120px] gap-4 px-4 py-3 items-center text-sm">
                    {/* Kolom 1: Details (impliciet door grid) */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${ 
                          item.merk === "Tiger" 
                            ? "bg-amber-50 text-amber-700" 
                            : item.merk === "Protech" 
                              ? "bg-red-50 text-red-700" 
                              : "bg-blue-50 text-blue-700" 
                        }`} 
                      >
                        <Image 
                          src={`/images/${item.merk.toLowerCase()}-logo.svg`} 
                          alt={`${item.merk} logo`} 
                          width={16} height={16}
                        />
                        {item.merk}
                      </span>
                      <span>Doos ID: {item.id}</span> {/* Of toon #idx+1 ? */} 
                    </div>
                    {/* Kolom 2: Aantal Dozen */}
                    <div className="text-right font-medium">{item.aantal_dozen}</div>
                    {/* Kolom 3: Gewicht */}
                    <div className="text-right">{(item.gewicht).toFixed(2)} kg</div>
                    {/* Kolom 4: Status */}
                    <div className="text-right">
                      {/* Status badge hier later? */} 
                    </div>
                    {/* Kolom 5: Acties */}
                    <div>
                      <button
                        onClick={() => openVerbruiksModal(item)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs py-1.5 px-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 w-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Verbruik
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Resultaten feedback */}
      {Object.keys(gegroepeerdeItems).length === 0 && (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100 animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4m8-9v18m-9-9h18" />
          </svg>
          <h3 className="text-xl font-bold mb-2">Geen resultaten gevonden</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            We konden geen voorraad vinden die voldoet aan je zoekcriteria.
          </p>
          <button
            onClick={() => {
              setZoekTekst('');
              setFilterMerk('alle');
            }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset alle filters
          </button>
        </div>
      )}
      
      {/* Verbruik Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleVerbruikRegistreren}>
        {geselecteerdItem && (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <div 
                className="w-8 h-8 rounded-md mr-3" 
                style={{ backgroundColor: getRalKleurHex(geselecteerdItem.ral_kleur) }}
              ></div>
              Poedergebruik registreren
            </h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">RAL {geselecteerdItem.ral_kleur} - {geselecteerdItem.laktype} - {geselecteerdItem.merk}</p>
                  <p className="text-sm text-blue-600">Huidige voorraad: {geselecteerdItem.aantal_dozen} {geselecteerdItem.aantal_dozen === 1 ? 'doos' : 'dozen'}</p>
                  {/* Historiek laatste verbruik */}
                  <HistoriekVerbruik itemId={geselecteerdItem.id} />
                </div>
              </div>
            </div>
            
            {/* Weegschaal instructie */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-medium block mb-1">Gebruik de weegschaal naast de voorraad</span>
                  <ol className="text-sm list-decimal pl-5 space-y-1">
                    <li>Plaats de doos op de weegschaal en noteer het begingewicht</li>
                    <li>Gebruik de benodigde hoeveelheid poeder</li>
                    <li>Plaats de doos terug op de weegschaal</li>
                    <li>Voer het eindgewicht in</li>
                  </ol>
                </div>
              </div>
            </div>
            
            {/* Invoermethode selector - kies tussen weegschaal of direct invoeren */}
            <div className="flex space-x-4 mb-6">
              <button
                className={`flex-1 py-3 px-4 rounded-xl text-lg font-medium ${!directeInvoer ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setDirecteInvoer(false)}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  Weegschaal gebruiken
                </div>
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded-xl text-lg font-medium ${directeInvoer ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setDirecteInvoer(true)}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Direct invoeren
                </div>
              </button>
            </div>

            {/* Toon alleen het relevante formulier gebaseerd op de geselecteerde methode */}
            {directeInvoer ? (
              // DIRECT INVOEREN FORMULIER
              <div className="mb-8 p-6 bg-white rounded-2xl border shadow-sm">
                <h3 className="text-xl font-bold mb-5">Verbruikte hoeveelheid</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Verbruikte gewicht (kg)</label>
                  <div className="flex max-w-md">
                    <button 
                      className="bg-gray-200 px-6 py-4 text-2xl font-bold rounded-l-lg"
                      onClick={() => setCustomHoeveelheid(Math.max(0.25, customHoeveelheid - 0.25))}
                      type="button"
                    >-</button>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={customHoeveelheid.toFixed(2)}
                      onChange={(e) => setCustomHoeveelheid(Number(e.target.value) || 0)}
                      className="w-full p-4 text-center text-2xl border-y border-gray-300"
                    />
                    <button
                      className="bg-gray-200 px-6 py-4 text-2xl font-bold rounded-r-lg"
                      onClick={() => setCustomHoeveelheid(customHoeveelheid + 0.25)}
                      type="button"
                    >+</button>
                    <span className="ml-2 text-xl flex items-center">kg</span>
                  </div>
                </div>
              </div>
            ) : (
              // WEEGSCHAAL FORMULIER
              <div className="mb-8 p-6 bg-white rounded-2xl border shadow-sm">
                <h3 className="text-xl font-bold mb-5">Gewicht registreren</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Begingewicht (kg)</label>
                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={beginGewicht || ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setBeginGewicht(value);
                          if (value && eindGewicht) {
                            const verschil = value - eindGewicht;
                            setCustomHoeveelheid(verschil > 0 ? verschil : 0);
                          }
                        }}
                        className="w-full p-4 text-center text-2xl border rounded-lg"
                        placeholder="0.00"
                      />
                      <span className="ml-2 text-xl flex items-center">kg</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Eindgewicht (kg)</label>
                    <div className="flex">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={eindGewicht || ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setEindGewicht(value);
                          if (beginGewicht && value) {
                            const verschil = beginGewicht - value;
                            setCustomHoeveelheid(verschil > 0 ? verschil : 0);
                          }
                        }}
                        className="w-full p-4 text-center text-2xl border rounded-lg"
                        placeholder="0.00"
                      />
                      <span className="ml-2 text-xl flex items-center">kg</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Verbruikte hoeveelheid:</span>
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-blue-700">
                        {beginGewicht !== null && eindGewicht !== null && beginGewicht >= eindGewicht ? 
                          `${(beginGewicht - eindGewicht).toFixed(2)} kg` : 
                          "0.00 kg"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {beginGewicht !== null && eindGewicht !== null && beginGewicht >= eindGewicht ? 
                          `(${((beginGewicht - eindGewicht) / 20).toFixed(2)} dozen)` : 
                          "(0 dozen)"}
                      </div>
                    </div>
                  </div>

                  {beginGewicht !== null && eindGewicht !== null && beginGewicht < eindGewicht && (
                    <div className="mt-3 text-red-500 bg-red-50 p-2 rounded border border-red-200 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Begingewicht kan niet lager zijn dan eindgewicht
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>
    </main>
  );
}
