import { PoederDoos } from './data';

// Verwijder een doos op basis van ID
export const verwijderVoorraadItem = (id: number, voorraadData: PoederDoos[], saveToLocalStorage: () => void): PoederDoos[] => {
  const nieuweVoorraad = voorraadData.filter(item => item.id !== id);
  saveToLocalStorage();
  return nieuweVoorraad;
};
