export interface CsvSchema {
  headers: string[];
  minRows: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCsv(content: string, schema: CsvSchema): ValidationResult {
  const lines = content.trim().split('\n');
  const errors: string[] = [];

  const actualHeaders = lines[0].split(',');
  for (const required of schema.headers) {
    if (!actualHeaders.includes(required)) {
      errors.push(`Missing required header: "${required}"`);
    }
  }

  const dataRows = lines.slice(1).filter(l => l.trim().length > 0);
  if (dataRows.length < schema.minRows) {
    errors.push(`Expected at least ${schema.minRows} data row(s), found ${dataRows.length}`);
  }

  return { valid: errors.length === 0, errors };
}

export const USER_CSV_SCHEMA: CsvSchema = {
  headers: ['id', 'name', 'email', 'role', 'status'],
  minRows: 1,
};
