export const HEALTH_ISSUES = [
  { value: "SURGERY", label: "Old/New Surgery" },
  { value: "INJURY", label: "Old/New Injury" },
  { value: "CERVICAL_SHOULDER", label: "Cervical / Shoulder" },
  { value: "BACK", label: "Back" },
  { value: "KNEE", label: "Knee" },
  { value: "BLOOD_PRESSURE", label: "Blood Pressure" },
  { value: "HEART", label: "Heart" },
  { value: "THYROID", label: "Thyroid" },
  { value: "ANXIETY_DEPRESSION", label: "Anxiety / Depression" },
  { value: "DIABETES", label: "Diabetes" },
  { value: "OTHER", label: "Other" },
] as const;

export const HEALTH_ISSUE_VALUES = HEALTH_ISSUES.map((issue) => issue.value) as [
  (typeof HEALTH_ISSUES)[number]["value"],
  ...(typeof HEALTH_ISSUES)[number]["value"][],
];

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
