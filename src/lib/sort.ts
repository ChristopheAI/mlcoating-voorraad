export function sorteerOpRAL(input: string): number {
  // Haal het eerste 4-cijferige getal uit de string (vb. "RAL 9005 mat" ⇒ 9005)
  const match = input.match(/(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Fallback: ongeldige of ontbrekende RAL => helemaal achteraan sorteren
  return Number.MAX_SAFE_INTEGER;
}
