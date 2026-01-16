/**
 * Scoped Form Validation Helpers
 * Lightweight validation for wizard and settings forms.
 * @foundation V34-STAB-BP-03
 */

export type Validator = (value: any) => string | null;

/**
 * Validator: Check if value is present.
 */
export const isRequired: Validator = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Field is required';
  if (Array.isArray(value) && value.length === 0) return 'List cannot be empty';
  return null;
};

/**
 * Validator: Check if value is a number > 0.
 */
export const isPositiveNumber: Validator = (value: any) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 'Must be a positive value';
  return null;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a data object against a schema of field validators.
 * Returns a result object with a boolean flag and a map of error strings.
 */
export function validateFields<T extends Record<string, any>>(
  schema: Partial<Record<keyof T, Validator | Validator[]>>,
  data: T
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.entries(schema).forEach(([field, validators]) => {
    if (!validators) return;

    const value = data[field];
    const validatorList = Array.isArray(validators) ? validators : [validators];

    for (const validator of validatorList) {
      const error = validator(value);
      if (error) {
        errors[field] = error;
        isValid = false;
        break; // Return first error found for the field
      }
    }
  });

  return { isValid, errors };
}

/**
 * Returns the errors map from a validation result.
 */
export function getValidationErrors(result: ValidationResult): Record<string, string> {
  return result.errors;
}
