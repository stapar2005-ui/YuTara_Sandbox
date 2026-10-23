export type Certification = {
  id: string;
  title: string;
  issuer: string;
  description: string;
  accent: string;
};

export const CERTIFICATIONS: Certification[] = [
  { id: "bir", title: "BIR Certificate of Registration", issuer: "Bureau of Internal Revenue", description: "Confirms YuTara's registration and authority to operate as a business.", accent: "#d9b36a" },
  { id: "mayor", title: "Mayor's Permit", issuer: "City Government of Panabo", description: "The permit to operate within Panabo City.", accent: "#9fb8a0" },
  { id: "business", title: "Business Registration", issuer: "Department of Trade and Industry", description: "YuTara's registered business name and profile.", accent: "#c88d70" },
  { id: "barangay", title: "Barangay Certification", issuer: "Barangay Council", description: "A community certification supporting the listing's location.", accent: "#b7a57c" },
  { id: "tax", title: "Tax Declaration", issuer: "City Assessor's Office", description: "The current tax declaration associated with the property.", accent: "#86a7a0" },
  { id: "internal", title: "YuTara Verification", issuer: "YuTara review team", description: "An internal checklist summary confirming submitted information passed YuTara review.", accent: "#b6c879" },
];
