export const AVAILABLE_APPLICATION_FIELDS = [
  { fieldKey: 'cv', fieldLabel: 'CV / Resume' },
  { fieldKey: 'coverLetter', fieldLabel: 'Cover Letter' },
  { fieldKey: 'highestEducation', fieldLabel: 'Highest Education' },
  { fieldKey: 'fieldOfStudy', fieldLabel: 'Field of Study' },
  { fieldKey: 'yearsOfExperience', fieldLabel: 'Years of Experience' },
  {
    fieldKey: 'currentEmploymentStatus',
    fieldLabel: 'Current Employment Status',
  },
  { fieldKey: 'expectedSalary', fieldLabel: 'Expected Salary' },
  { fieldKey: 'noticePeriod', fieldLabel: 'Notice Period' },
  { fieldKey: 'availableStartDate', fieldLabel: 'Available Start Date' },
  { fieldKey: 'willingToRelocate', fieldLabel: 'Willing to Relocate' },
  { fieldKey: 'portfolioUrl', fieldLabel: 'Portfolio URL' },
  { fieldKey: 'linkedinUrl', fieldLabel: 'LinkedIn URL' },
  { fieldKey: 'additionalAnswers', fieldLabel: 'Additional Answers' },
] as const;

export type ApplicationFieldKey =
  (typeof AVAILABLE_APPLICATION_FIELDS)[number]['fieldKey'];

export const APPLICATION_FIELD_KEYS = AVAILABLE_APPLICATION_FIELDS.map(
  ({ fieldKey }) => fieldKey,
);

export function getApplicationFieldLabel(fieldKey: ApplicationFieldKey): string {
  return (
    AVAILABLE_APPLICATION_FIELDS.find((field) => field.fieldKey === fieldKey)
      ?.fieldLabel ?? fieldKey
  );
}
