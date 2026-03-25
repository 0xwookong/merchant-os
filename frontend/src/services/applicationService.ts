import { api } from "@/lib/api";

// Person info shared by UBO, Director, Authorized Person
export interface PersonInfo {
  name: string;
  idTypeNumber: string; // e.g. "Passport: E12345678"
  placeOfBirth: string;
  dateOfBirth: string;
  nationality: string;
}

// UBO extends PersonInfo with ownership + address
export interface UboInfo extends PersonInfo {
  residentialAddress: string;
  sharePercentage: number;
  isLegalRep?: boolean;
}

// Director = PersonInfo
export type DirectorInfo = PersonInfo;

// Authorized Person extends PersonInfo with contact
export interface AuthorizedPersonInfo extends PersonInfo {
  phone: string;
  email: string;
}

// Licence information (Section C)
export interface LicenceInfo {
  regulated: boolean;
  jurisdiction?: string;
  regulatorName?: string;
  licenceType?: string;
  licenceNumber?: string;
  licenceDate?: string;
  lastAuditDate?: string;
}

// Full application response
export interface ApplicationResponse {
  id: number;
  status: string;
  counterpartyType: string | null;
  currentStep: number;

  // Section A: Company info
  companyName: string | null;
  companyNameEn: string | null;
  regCountry: string | null;
  regNumber: string | null;
  taxIdNumber: string | null;
  businessLicenseNo: string | null;
  companyType: string | null;
  incorporationDate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;

  // Section A: People
  legalRep: PersonInfo | null;
  ubos: UboInfo[] | null;
  noUboDeclaration: boolean;
  controlStructureDesc: string | null;
  directors: DirectorInfo[] | null;
  authorizedPersons: AuthorizedPersonInfo[] | null;

  // Section B: Business info
  businessType: string | null;
  website: string | null;
  purposeOfAccount: string | null;
  sourceOfIncome: string | null;
  estAmountPerTxFrom: string | null;
  estAmountPerTxTo: string | null;
  estTxPerYear: string | null;
  monthlyVolume: string | null;
  monthlyTxCount: string | null;
  supportedFiat: string | null;
  supportedCrypto: string | null;
  useCases: string | null;
  businessDesc: string | null;

  // Section C: Licence info
  licenceInfo: LicenceInfo | null;

  // Compliance declarations
  infoAccuracyConfirmed: boolean;
  sanctionsDeclared: boolean;
  termsAccepted: boolean;

  // Review
  rejectReason: string | null;
  needInfoDetails: string[] | null;

  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Save draft request (all fields optional for partial save)
export interface ApplicationSaveDraftRequest {
  currentStep?: number;
  counterpartyType?: string;

  // Section A: Company
  companyName?: string;
  companyNameEn?: string;
  regCountry?: string;
  regNumber?: string;
  taxIdNumber?: string;
  businessLicenseNo?: string;
  companyType?: string;
  incorporationDate?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Section A: People
  legalRep?: PersonInfo;
  ubos?: UboInfo[];
  noUboDeclaration?: boolean;
  controlStructureDesc?: string;
  directors?: DirectorInfo[];
  authorizedPersons?: AuthorizedPersonInfo[];

  // Section B: Business
  businessType?: string;
  website?: string;
  purposeOfAccount?: string;
  sourceOfIncome?: string;
  estAmountPerTxFrom?: string;
  estAmountPerTxTo?: string;
  estTxPerYear?: string;
  monthlyVolume?: string;
  monthlyTxCount?: string;
  supportedFiat?: string;
  supportedCrypto?: string;
  useCases?: string;
  businessDesc?: string;

  // Section C: Licence
  licenceInfo?: LicenceInfo;
}

export interface ApplicationSubmitRequest {
  infoAccuracyConfirmed: boolean;
  sanctionsDeclared: boolean;
  termsAccepted: boolean;
}

export interface DocumentResponse {
  id: number;
  applicationId: number;
  docType: string;
  docName: string;
  fileSize: number;
  mimeType: string;
  uboIndex: number | null;
  status: string;
  createdAt: string;
}

export const applicationService = {
  getCurrent(): Promise<ApplicationResponse | null> {
    return api.get<ApplicationResponse | null>("/api/v1/application/current");
  },

  saveDraft(data: ApplicationSaveDraftRequest): Promise<ApplicationResponse> {
    return api.post<ApplicationResponse>("/api/v1/application/save-draft", data);
  },

  submit(data: ApplicationSubmitRequest): Promise<ApplicationResponse> {
    return api.post<ApplicationResponse>("/api/v1/application/submit", data);
  },

  resubmit(data: ApplicationSubmitRequest): Promise<ApplicationResponse> {
    return api.post<ApplicationResponse>("/api/v1/application/resubmit", data);
  },

  uploadDocument(file: File, docType: string, uboIndex?: number): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    if (uboIndex !== undefined) {
      formData.append("uboIndex", String(uboIndex));
    }
    return api.upload<DocumentResponse>("/api/v1/application/documents", formData);
  },

  deleteDocument(id: number): Promise<string> {
    return api.delete<string>(`/api/v1/application/documents/${id}`);
  },

  listDocuments(): Promise<DocumentResponse[]> {
    return api.get<DocumentResponse[]>("/api/v1/application/documents");
  },
};
