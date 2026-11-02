/**
 * Checks whether a number, string, or value has more than the specified decimal places.
 * Returns false if the value is null, undefined, empty string, or NaN.
 */
export function hasMoreThanTwoDecimals(value: unknown, maxDecimals: number = 2): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return false;
  }
  const str = String(value).trim();
  if (str.includes('e-') || str.includes('E-')) {
    return true;
  }
  const parts = str.split('.');
  if (parts.length > 1) {
    return parts[1].length > maxDecimals;
  }
  return false;
}

/**
 * Returns a validation error if the value exceeds the allowed decimal places (default 2).
 * Returns null if the value is valid or empty (does not enforce required).
 */
export function validateDecimalPlaces(
  value: unknown,
  message: string = 'Maximum 2 decimal places allowed',
  maxDecimals: number = 2
) {
  if (hasMoreThanTwoDecimals(value, maxDecimals)) {
    return { kind: 'maxDecimalPlaces', message };
  }
  return null;
}

