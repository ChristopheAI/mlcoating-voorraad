"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { voorraad, PoederDoos } from '@/lib/data';

// De cardview is ontworpen met focus op gemakkelijke visuele herkenning
export default function CardViewPage() {
  const [voorraadItems, setVoorraadItems] = useState<PoederDoos[]>(voorraad());
  const [zoekTekst, setZoekTekst] = useState('');
  const [filterMerk, setFilterMerk] = useState('alle');
  
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
    
    // Groepeer per RAL + Laktype
    const groepering: Record<string, PoederDoos[]> = {};
    gefilterd.forEach(item => {
      const key = `${item.ral_kleur}-${item.laktype}`;
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
          <p className="text-gray-600 mt-1">
            {Object.values(gegroepeerdeItems).flat().length} items gevonden
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <Link 
            href="/voorraad" 
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-5 rounded-xl font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Terug naar tabel
          </Link>
          <Link 
            href="/voorraad/nieuw" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl text-center font-semibold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Nieuwe doos
          </Link>
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
      
      {/* Kaartweergave met grote visuele elementen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(gegroepeerdeItems).map(([key, items]) => {
          const [ral, laktype] = key.split('-');
          const merken = items.map(item => item.merk);
          const totaleDoosBedrag = items.reduce((sum, item) => sum + item.aantal_dozen, 0);
          const hasLowStock = totaleDoosBedrag < 3;
          
          return (
            <div key={key} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-fadeIn">
              {/* Kleur header */}
              <div 
                className="h-16 w-full" 
                style={{ backgroundColor: getRalKleurHex(ral) }}
              ></div>
              
              <div className="p-5">
                <div className="flex justify-between">
                  <h3 className="text-xl font-bold mb-1">RAL {ral}</h3>
                  {hasLowStock && (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      Lage voorraad
                    </span>
                  )}
                </div>
                
                <div className="text-gray-600 mb-3 capitalize">{laktype}</div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-sm text-gray-500">Totaal voorraad</div>
                    <div className="text-2xl font-bold">{totaleDoosBedrag} dozen</div>
                  </div>
                  
                  <div className="flex gap-1">
                    {merken.map(merk => (
                      <span 
                        key={`${key}-${merk}`} 
                        className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium"
                      >
                        {merk}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Verbruik registreren
                </button>
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
    </main>
  );
}
