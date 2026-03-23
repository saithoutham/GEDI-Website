import type { PatientRecord } from './clinicianPanel';

// Optional integration hook:
// If your health system can export a CSV/JSON list of de-identified patients,
// you can replace this with fetched data.
export const DEMO_PATIENTS: PatientRecord[] = [
  { id: 'Patient 1', age: 52, sex: 'female', smokingStatus: 'former', packYears: 25, yearsSinceQuit: 8 },
  { id: 'Patient 2', age: 44, sex: 'female', smokingStatus: 'never', packYears: 0, yearsSinceQuit: null },
  { id: 'Patient 3', age: 67, sex: 'male', smokingStatus: 'current', packYears: 35, yearsSinceQuit: null },
  { id: 'Patient 4', age: 29, sex: 'other', smokingStatus: 'never', packYears: 0, yearsSinceQuit: null },
  { id: 'Patient 5', age: 81, sex: 'male', smokingStatus: 'former', packYears: 40, yearsSinceQuit: 5 },
];
