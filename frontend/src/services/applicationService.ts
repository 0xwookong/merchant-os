import { api } from "@/lib/api";

// Legal representative info
export interface LegalRepInfo {
  name: string;
  nationality: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
}

// Ultimate Beneficial Owner info
export interface UboInfo {
  name: string;
  nationality: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  sharePercentage: number;
  isLegalRep?: boolean;
}

// Full application response
export interface ApplicationResponse {
  id: number;
  status: string;
  currentStep: number;

  // Step 1: Company info
  companyName: string | null;
  companyNameEn: string | null;
  regCountry: string | null;
  regNumber: string | null;
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

  // Step 2: Legal rep + UBOs
  legalRep: LegalRepInfo | null;
  ubos: UboInfo[] | null;
  noUboDeclaration: boolean;
  controlStructureDesc: string | null;

  // Step 3: Business info
  businessType: string | null;
  website: string | null;
  monthlyVolume: string | null;
  monthlyTxCount: string | null;
  supportedFiat: string | null;
  supportedCrypto: string | null;
  useCases: string | null;
  businessDesc: string | null;

  // Step 5: Compliance declarations
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

  // Step 1
  companyName?: string;
  companyNameEn?: string;
  regCountry?: string;
  regNumber?: string;
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

  // Step 2
  legalRep?: LegalRepInfo;
  ubos?: UboInfo[];
  noUboDeclaration?: boolean;
  controlStructureDesc?: string;

  // Step 3
  businessType?: string;
  website?: string;
  monthlyVolume?: string;
  monthlyTxCount?: string;
  supportedFiat?: string;
  supportedCrypto?: string;
  useCases?: string;
  businessDesc?: string;
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
