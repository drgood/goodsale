/**
 * Shift Calculations - Pure functions for consistent expectedCash calculation
 * 
 * Formula: Expected Cash = Starting Cash + Cash Sales + Settlement Collections - Cash Returns
 * 
 * This centralizes the calculation logic to prevent inconsistencies across APIs.
 */

export interface ShiftData {
  startingCash: number | string;
  cashSales: number | string;
  cashSettlements?: number | string;
  cashReturns?: number | string;
}

/**
 * Calculate expected cash in drawer based on shift components.
 * 
 * Formula: startingCash + cashSales + cashSettlements - cashReturns
 * 
 * @param shift - Object with shift numeric fields
 * @returns Calculated expected cash amount as number
 * @throws Error if any required field is missing or invalid
 */
export function calculateExpectedCash(shift: ShiftData): number {
  try {
    const startingCash = Number(shift.startingCash) || 0;
    const cashSales = Number(shift.cashSales) || 0;
    const cashSettlements = Number(shift.cashSettlements) || 0;
    const cashReturns = Number(shift.cashReturns) || 0;

    // Validate numbers
    if (isNaN(startingCash) || isNaN(cashSales) || isNaN(cashSettlements) || isNaN(cashReturns)) {
      throw new Error('Invalid numeric values in shift data');
    }

    const expectedCash = startingCash + cashSales + cashSettlements - cashReturns;

    // Ensure result is valid number
    if (isNaN(expectedCash)) {
      throw new Error('Calculated expectedCash resulted in NaN');
    }

    return expectedCash;
  } catch (error) {
    throw new Error(
      `Failed to calculate expected cash: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate that stored expectedCash matches calculated value.
 * Used for debugging and ensuring data integrity.
 * 
 * @param shift - Full shift object with all fields
 * @param storedExpectedCash - Value stored in database
 * @returns Object with match status and difference
 */
export function validateExpectedCash(
  shift: ShiftData & { expectedCash: number | string },
  storedExpectedCash?: number | string
): {
  isValid: boolean;
  calculated: number;
  stored: number;
  difference: number;
} {
  const calculated = calculateExpectedCash(shift);
  const stored = Number(storedExpectedCash ?? shift.expectedCash) || 0;
  const difference = Math.abs(calculated - stored);

  return {
    isValid: difference < 0.01, // Allow for floating point rounding
    calculated,
    stored,
    difference
  };
}

/**
 * Format shift data for database storage.
 * Ensures all numeric fields are converted to strings (as required by DB schema).
 * 
 * @param data - Object with shift fields (can be numbers or strings)
 * @returns Object with all numeric fields as strings
 */
export function formatShiftForDB(data: Record<string, any>): Record<string, string> {
  const formatted: Record<string, string> = {};

  // List of numeric fields that should be stored as strings
  const numericFields = [
    'startingCash',
    'cashSales',
    'cardSales',
    'mobileSales',
    'creditSales',
    'totalSales',
    'expectedCash',
    'actualCash',
    'cashDifference',
    'cashSettlements',
    'cardSettlements',
    'mobileSettlements',
    'cashReturns'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (numericFields.includes(key) && value !== undefined && value !== null) {
      // Convert to number first (to handle string inputs), then to string
      formatted[key] = String(Number(value) || 0);
    } else if (value !== undefined && value !== null) {
      formatted[key] = String(value);
    }
  }

  return formatted;
}
