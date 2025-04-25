"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { voegVoorraadItemToe } from "@/lib/data";

// Constanten volgens het implementatieplan
const laktypes = [
  { type: "mat", subtypes: [] },
  { type: "glans", subtypes: [] },
  { type: "structuur", subtypes: ["fijne structuur", "medium structuur", "grove structuur"] },
  { type: "satijn", subtypes: [] },
  { type: "primer", subtypes: [] }
];

// Merken in de industrie
const merken = ["Protech", "Sherwin-Williams", "Tiger"];

// RAL kleuren met beschrijvende namen, gegroepeerd per kleurcategorie
type KleurGroep = "Wit- en zwarttinten" | "Grijstinten" | "Blauwtinten" | "Groentinten" | "Roodtinten";
type RalKleur = { code: string; naam: string; hex: string };

const ralKleurGroepen: Record<KleurGroep, RalKleur[]> = {
  "Wit- en zwarttinten": [
    { code: "9016", naam: "Verkeerswit", hex: "#f1f1f1" },
    { code: "9010", naam: "Zuiver wit", hex: "#ffffff" },
    { code: "9003", naam: "Signaalwit", hex: "#f4f4f4" },
    { code: "9005", naam: "Gitzwart", hex: "#0a0a0a" },
    { code: "9001", naam: "Crèmewit", hex: "#fdf4e3" }
  ],
  "Grijstinten": [
    { code: "7016", naam: "Antracietgrijs", hex: "#293133" },
    { code: "7035", naam: "Lichtgrijs", hex: "#d7d7d7" },
    { code: "7039", naam: "Kwartsgrijs", hex: "#6c6960" },
    { code: "7040", naam: "Venstergrijs", hex: "#9da1aa" },
    { code: "7022", naam: "Ombergrijs", hex: "#332f2c" },
    { code: "7030", naam: "Steengrijs", hex: "#8b8c7a" },
    { code: "7038", naam: "Agaatgrijs", hex: "#b5b8b1" }
  ],
  "Blauwtinten": [
    { code: "5010", naam: "Gentiaanblauw", hex: "#0e294b" },
    { code: "5002", naam: "Ultramarijnblauw", hex: "#20214f" }
  ],
  "Groentinten": [
    { code: "6009", naam: "Dennegroen", hex: "#31372b" },
    { code: "6005", naam: "Mosgroen", hex: "#2f4538" }
  ],
  "Roodtinten": [
    { code: "3000", naam: "Vuurrood", hex: "#af2b1e" },
    { code: "3001", naam: "Signaalrood", hex: "#a52019" },
    { code: "3003", naam: "Robijnrood", hex: "#9b111e" },
    { code: "3005", naam: "Wijnrood", hex: "#5e2129" }
  ]
};

// Formulierstatus type
type FormState = {
  ral_kleur: string;
  kleurGroep: KleurGroep | "";
  laktype: string;
  laksubtype: string;
  merk: string;
  aantal_dozen: number;
  vervaldatum: string;
  
  // Protech-specifieke velden
  protech_productcode?: string;
  protech_lotnummer?: string;
  
  // Tiger-specifieke velden
  tiger_productnummer?: string;
  tiger_kwaliteit?: string;
}

export default function NieuwPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    ral_kleur: "",
    kleurGroep: "",
    laktype: "",
    laksubtype: "",
    merk: "",
    aantal_dozen: 1,
    vervaldatum: ""
  });
  
  // Submenu alleen tonen indien van toepassing (structuur gekozen)
  const toonLakSubTypes = useMemo(() => {
    const selectedLaktype = laktypes.find(l => l.type === formState.laktype);
    return selectedLaktype?.subtypes && selectedLaktype.subtypes.length > 0;
  }, [formState.laktype]);

  // Handler voor veldwijzigingen
  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Speciale logica voor velden die andere velden beïnvloeden
    if (field === 'kleurGroep') {
      setFormState(prev => ({
        ...prev,
        ral_kleur: "",  // Reset RAL keuze als kleurgroep verandert
      }));
    }
    
    if (field === 'laktype') {
      setFormState(prev => ({
        ...prev,
        laksubtype: "", // Reset subtype als laktype verandert
      }));
    }
    
    // Specifieke velden resetten als merk verandert
    if (field === 'merk') {
      setFormState(prev => {
        const newState = {
          ...prev,
          protech_productcode: undefined,
          protech_lotnummer: undefined,
          tiger_productnummer: undefined,
          tiger_kwaliteit: undefined
        };
        return newState;
      });
    }
  };

  // Formulier valideren voor submissie
  const validateForm = (): boolean => {
    if (!formState.merk) {
      setError("Selecteer een merk");
      return false;
    }

    // Merk-specifieke validatie
    if (formState.merk === "Protech") {
      if (!formState.protech_productcode) {
        setError("Vul de Protech productcode in");
        return false; 
      }
    }
    
    if (formState.merk === "Tiger") {
      if (!formState.tiger_productnummer) {
        setError("Vul het Tiger productnummer in");
        return false;
      }
    }
    
    if (!formState.ral_kleur) {
      setError("Selecteer een RAL-kleur");
      return false;
    }
    
    if (!formState.laktype) {
      setError("Selecteer een laktype");
      return false;
    }
    
    if (toonLakSubTypes && !formState.laksubtype) {
      setError("Selecteer een subtype voor de structuurlak");
      return false;
    }
    
    if (formState.aantal_dozen <= 0) {
      setError("Het aantal dozen moet minimaal 1 zijn");
      return false;
    }
    
    return true;
  };

  // Formulier indienen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    try {
      // Bereid data voor op basis van het geselecteerde merk en velden
      const newItemData = {
        ral_kleur: formState.ral_kleur,
        laktype: formState.laktype + (formState.laksubtype ? ` (${formState.laksubtype})` : ""),
        merk: formState.merk,
        aantal_dozen: formState.aantal_dozen,
        vervaldatum: formState.vervaldatum || undefined,
      };
      
      // Voeg item toe aan voorraad
      voegVoorraadItemToe(newItemData);
      
      // Toon succesmelding
      setSuccess("Nieuwe voorraad succesvol toegevoegd!");
      
      // Navigeer terug na korte vertraging
      setTimeout(() => {
        router.push("/voorraad");
      }, 1500);
    } catch (err) {
      console.error("Fout bij toevoegen:", err);
      setError("Er is een fout opgetreden bij het toevoegen van dit item.");
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Nieuwe Poederdoos Toevoegen</h1>
            <p className="text-gray-500 mt-1">Vul alle velden in om een nieuwe poederdoos aan de voorraad toe te voegen</p>
          </div>
          <Link 
            href="/voorraad" 
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-xl shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar overzicht
          </Link>
        </div>
      </header>

      {/* Fout- en succesmeldingen */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 animate-fadeIn">
        {/* DEEL 1: Merkgegevens (bovenaan voor gebruiksgemak) */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            1. Selecteer Merk
          </h2>
          
          {/* Merk selectie als visuele knoppen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {merken.map(merk => (
              <button
                key={merk}
                type="button"
                onClick={() => handleFieldChange('merk', merk)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formState.merk === merk 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 ring-offset-1' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-lg mb-1">{merk}</div>
                <div className="text-sm text-gray-500">
                  {merk === "Protech" && "Productcode verplicht"}
                  {merk === "Tiger" && "Productnummer verplicht"}
                  {merk === "Sherwin-Williams" && "Standaard velden"}
                </div>
              </button>
            ))}
          </div>
          
          {/* Merk-specifieke velden */}
          {formState.merk === "Protech" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Protech Productcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.protech_productcode || ''}
                  onChange={(e) => handleFieldChange('protech_productcode', e.target.value)}
                  placeholder="Bijv. PC-9005-M"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  LOT Nummer
                </label>
                <input
                  type="text"
                  value={formState.protech_lotnummer || ''}
                  onChange={(e) => handleFieldChange('protech_lotnummer', e.target.value)}
                  placeholder="Optioneel"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          {formState.merk === "Tiger" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tiger Productnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.tiger_productnummer || ''}
                  onChange={(e) => handleFieldChange('tiger_productnummer', e.target.value)}
                  placeholder="Bijv. T-29/90007"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tiger Kwaliteit
                </label>
                <select
                  value={formState.tiger_kwaliteit || ''}
                  onChange={(e) => handleFieldChange('tiger_kwaliteit', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecteer kwaliteit</option>
                  <option value="Standard">Standard</option>
                  <option value="High Durability">High Durability</option>
                  <option value="Architectural">Architectural</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* DEEL 2: RAL Kleur selectie */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            2. Selecteer RAL Kleur
          </h2>
          
          {/* Kleurgroep selectie */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Kleurcategorie <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.keys(ralKleurGroepen).map((groep) => (
                <button
                  key={groep}
                  type="button"
                  onClick={() => handleFieldChange('kleurGroep', groep as KleurGroep)}
                  className={`py-2 px-3 rounded-lg border font-medium transition-colors ${
                    formState.kleurGroep === groep 
                      ? 'bg-blue-100 border-blue-500 text-blue-800' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {groep}
                </button>
              ))}
            </div>
          </div>
          
          {/* RAL kleur selectie als kleurvlakken */}
          {formState.kleurGroep && (
            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-2">
                RAL kleur <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ralKleurGroepen[formState.kleurGroep as KleurGroep].map((kleur) => (
                  <button
                    key={kleur.code}
                    type="button"
                    onClick={() => handleFieldChange('ral_kleur', kleur.code)}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      formState.ral_kleur === kleur.code 
                        ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-full h-12 rounded-lg border border-gray-300 shadow-sm mb-2" 
                      style={{ backgroundColor: kleur.hex }}
                    ></div>
                    <div className="font-bold">RAL {kleur.code}</div>
                    <div className="text-sm text-gray-500">{kleur.naam}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* DEEL 3: Laktype selectie */}
        <div className="mb-8 border-b pb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            3. Selecteer Laktype
          </h2>
          
          {/* Laktype selectie */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Laktype <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {laktypes.map((lak) => (
                <button
                  key={lak.type}
                  type="button"
                  onClick={() => handleFieldChange('laktype', lak.type)}
                  className={`py-3 px-4 rounded-xl border-2 transition-colors ${
                    formState.laktype === lak.type 
                      ? 'border-blue-500 bg-blue-50 font-semibold' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="capitalize">{lak.type}</span>
                  {lak.subtypes.length > 0 && (
                    <span className="block text-xs text-gray-500 mt-1">+ subtypes</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Laktype subtypes indien van toepassing */}
          {toonLakSubTypes && (
            <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-gray-700 font-medium mb-2">
                Structuurtype <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {laktypes
                  .find(l => l.type === formState.laktype)?.subtypes
                  .map((subtype) => (
                    <button
                      key={subtype}
                      type="button"
                      onClick={() => handleFieldChange('laksubtype', subtype)}
                      className={`py-2 px-3 rounded-lg border transition-colors ${
                        formState.laksubtype === subtype 
                          ? 'bg-blue-100 border-blue-500 text-blue-800 font-medium' 
                          : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {subtype}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        {/* DEEL 4: Aantallen en vervaldatum */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            4. Voorraadgegevens
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Aantal dozen <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => handleFieldChange('aantal_dozen', Math.max(1, formState.aantal_dozen - 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-l-lg font-bold text-xl"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formState.aantal_dozen}
                  onChange={(e) => handleFieldChange('aantal_dozen', parseInt(e.target.value) || 0)}
                  className="w-full text-center py-3 border-y border-gray-300 text-xl font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleFieldChange('aantal_dozen', formState.aantal_dozen + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-r-lg font-bold text-xl"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Vervaldatum (optioneel)
              </label>
              <input
                type="date"
                value={formState.vervaldatum}
                onChange={(e) => handleFieldChange('vervaldatum', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Knoppen onderaan het formulier */}
        <div className="mt-10 flex justify-end gap-3">
          <Link 
            href="/voorraad" 
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm"
          >
            Toevoegen aan voorraad
          </button>
        </div>
      </form>
    </main>
  );
}
