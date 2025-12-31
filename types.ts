
export enum HealthStatus {
  HIGH = 'high',
  LOW = 'low',
  NORMAL = 'normal'
}

export interface Biomarker {
  name: string;
  currentValue: number;
  previousValue?: number;
  unit: string;
  status: HealthStatus;
  range: string;
  analogy: string;
  explanation: string;
}

export interface DoctorQuestion {
  question: string;
  why: string;
}

export interface SimpleMarker {
  name: string;
  value: string;
}

export interface AnalysisResult {
  patientName?: string;
  age?: string;
  gender?: string;
  collectionDate?: string;
  labId?: string;
  hospitalName?: string;
  doctorName?: string;
  hasSignature?: boolean;
  allMarkers?: SimpleMarker[];
  summary: string; // The "Trend Snapshot" title
  bottomLine: {
    main: string;
    good: string[];
    watch: string[];
  };
  executiveSummary: string; // Detailed human verdict
  biomarkers: Biomarker[];
  lifestyle: {
    diet: string;
    sleep: string;
    exercise: string;
  };
  doctorQuestions: DoctorQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}
