export const AVAILABLE_APPLICATION_FIELDS = [
  { fieldKey: 'cv', fieldLabel: 'CV / Resume', inputType: 'file' },
  { fieldKey: 'coverLetter', fieldLabel: 'Cover Letter', inputType: 'file' },
  {
    fieldKey: 'highestEducation',
    fieldLabel: 'Highest Education',
    inputType: 'text',
  },
  {
    fieldKey: 'fieldOfStudy',
    fieldLabel: 'Field of Study',
    inputType: 'text',
  },
  {
    fieldKey: 'yearsOfExperience',
    fieldLabel: 'Years of Experience',
    inputType: 'number',
  },
  {
    fieldKey: 'currentEmploymentStatus',
    fieldLabel: 'Current Employment Status',
    inputType: 'text',
  },
  {
    fieldKey: 'expectedSalary',
    fieldLabel: 'Expected Salary',
    inputType: 'number',
  },
  {
    fieldKey: 'noticePeriod',
    fieldLabel: 'Notice Period',
    inputType: 'text',
  },
  {
    fieldKey: 'availableStartDate',
    fieldLabel: 'Available Start Date',
    inputType: 'date',
  },
  {
    fieldKey: 'willingToRelocate',
    fieldLabel: 'Willing to Relocate',
    inputType: 'boolean',
  },
  {
    fieldKey: 'portfolioUrl',
    fieldLabel: 'Portfolio URL',
    inputType: 'url',
  },
  {
    fieldKey: 'linkedinUrl',
    fieldLabel: 'LinkedIn URL',
    inputType: 'url',
  },
  {
    fieldKey: 'additionalAnswers',
    fieldLabel: 'Additional Answers',
    inputType: 'textarea',
  },
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
