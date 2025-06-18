import { parse } from 'csv-parse/sync';

export function parseCSV(csvString) {
  try {
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Map CSV columns to lead fields
    return records.map(record => ({
      firstName: record.first_name || record.firstName || record.name?.split(' ')[0],
      lastName: record.last_name || record.lastName || record.name?.split(' ').slice(1).join(' '),
      email: record.email || record.Email,
      phone: record.phone || record.Phone || record.mobile,
      company: record.company || record.Company || record.organization,
      jobTitle: record.job_title || record.jobTitle || record.title,
      source: record.source || 'CSV_IMPORT',
      sourceDetails: {
        importedAt: new Date(),
        originalRecord: record
      }
    }));
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}