"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { voegVoorraadItemToe } from "@/lib/data";

const laktypes = ["mat", "glans", "structuur", "satijn", "primer"];
const merken = ["Protech", "Sherwin-Williams", "Tiger"];

export default function ToevoegenPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    ral_kleur: "",
    laktype: "",
    merk: "",
    aantal_dozen: 1,
    vervaldatum: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valideer formulier
    if (!form.ral_kleur || !form.laktype || !form.merk || form.aantal_dozen < 1) {
      alert("Vul alle verplichte velden in");
      return;
    }
    
    // Voeg toe aan voorraad
    voegVoorraadItemToe({
      ral_kleur: form.ral_kleur,
      laktype: form.laktype,
      merk: form.merk,
      aantal_dozen: form.aantal_dozen,
      // Alleen vervaldatum toevoegen als die is ingevuld
      ...(form.vervaldatum ? { vervaldatum: form.vervaldatum } : {})
    });
    
    // Redirect naar voorraad overzicht
    router.push("/voorraad");
  };

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nieuwe Voorraad Toevoegen</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">RAL Kleur</label>
          <input
            type="text"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="RAL kleur (bv. 9016)"
            value={form.ral_kleur}
            onChange={e => setForm({ ...form, ral_kleur: e.target.value })}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Laktype</label>
          <select 
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.laktype}
            onChange={e => setForm({ ...form, laktype: e.target.value })}
            required
          >
            <option value="">Kies een laktype</option>
            {laktypes.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Merk</label>
          <select
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.merk}
            onChange={e => setForm({ ...form, merk: e.target.value })}
            required
          >
            <option value="">Kies een merk</option>
            {merken.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Aantal Dozen</label>
          <input
            type="number"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={1}
            value={form.aantal_dozen}
            onChange={e => setForm({ ...form, aantal_dozen: Number(e.target.value) })}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Vervaldatum (optioneel)</label>
          <input
            type="date"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.vervaldatum}
            onChange={e => setForm({ ...form, vervaldatum: e.target.value })}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg"
        >
          Opslaan
        </button>
      </form>
    </main>
  );
}
