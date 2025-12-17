/**
 * Custom rounding function for prepaid tax
 * Truncate to 2 decimal places first, then check the third decimal place
 * If the third decimal place value > 0.0005, round up
 * Otherwise, keep the truncated value
 * 
 * Examples:
 * - 5.730625 -> truncate to 5.73, third decimal is 0.000625 > 0.0005 -> round up to 5.74
 * - 5.730123 -> truncate to 5.73, third decimal is 0.000123 < 0.0005 -> keep 5.73
 * - 1.918125 -> truncate to 1.91, third decimal is 0.008125 > 0.0005 -> round up to 1.92
 * 
 * @param value The value to round
 * @returns The rounded value to 2 decimal places
 */
export const roundPrepaidTax = (value: number): number => {
  // Truncate to 2 decimal places (not round)
  const truncated = Math.floor(value * 100) / 100;
  
  // Calculate the remainder (the part after 2 decimal places)
  const remainder = value - truncated;
  
  // If remainder > 0.0005, round up by adding 0.01
  if (remainder > 0.0005) {
    return Number((truncated + 0.01).toFixed(2));
  }
  
  // Otherwise, return the truncated value
  return Number(truncated.toFixed(2));
};

