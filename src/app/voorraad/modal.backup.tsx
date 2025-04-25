"use client";

// Modal component voor de verbruik functionaliteit met verbeterde UX voor werkvloerpersoneel
export const Modal = ({ isOpen, onClose, onSubmit, children }: { isOpen: boolean, onClose: () => void, onSubmit?: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 md:p-0 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-xl mx-auto overflow-hidden animate-fadeIn" 
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header met sluiten knop */}
        <div className="sticky top-0 z-10 bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div className="font-bold text-lg text-gray-700">Poedergebruik registreren</div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 hover:bg-gray-200 transition-colors"
            aria-label="Sluiten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal content met padding */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer met acties */}
        <div className="sticky bottom-0 z-10 bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100"
          >
            Annuleren
          </button>
          {onSubmit && (
            <button 
              onClick={onSubmit}
              className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Registreren
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Voeg keyframe animatie toe aan globals.css:
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.2s ease-out forwards;
// }
