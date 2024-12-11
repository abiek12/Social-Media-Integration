
export type VerificationData = {
    'hub.mode': string,
    'hub.challenge': string,
    'hub.verify_token': string
}

export interface FacebookWebhookRequest {
    object?: string;
    entry: Array<Entry>;
    contactEmail?: string;
    contactName?: string;
    contactPhone?: string | null;
    contactCountry?: string | null;
    contactState?: string | null;
    contactCity?: string | null;
    designation?: string | null;
    clientName?: string | null;
    leadText?: string | null;
    status?: string;
    leadSourceId?: number;
}

export interface Entry {
    id: string;
    time: number;
    changes: Array<Change>;
}

export interface Change {
    field: string;
    value: Value;
}

export interface Value {
    leadgen_id: string;
    page_id: string;
    [key: string]: any;
}

export type leadGenDataId = {
    leadgenId: string,
    pageId: string
}

export interface FieldData {
    name: string;
    values: string[];
}

export interface LeadData {
    created_time: string;
    id: string;
    ad_id?: string;
    form_id?: string;
    field_data: FieldData[];
}

export interface pageMetaDataTypes {
    id: string;
    name: string;
    access_token: string;
    tasks: ["ADMINISTER", "EDIT_PROFILE", "MODERATE", "CREATE_CONTENT", "VIEW_INSIGHTS"];
}

// Page message response types
export interface From {
  id?: string;
  email?: string;
  name?: string;
  username?: string;
}
  
export interface To {
  data?: Array<{
    id?: string;
    email?: string;
    name?: string;
    username?: string;
  }>;
}
  
export interface ReactionUser {
  id?: string;
  username?: string;
}
  
export interface Reaction {
  reaction?: string;
  users?: ReactionUser[];
}
  
export interface FetchMessageDetailsSuccessResponse {
  from: From;
  to: To;
  message: string;
  id?: string;
  created_time?: string; // ISO 8601 format
  is_unsupported?: boolean;
  reactions?: {
    data?: Reaction[];
  };
}
  
export interface FetchMessageDetailsErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}
  
// Union Type for the Function Return
export type FetchMessageDetailsResponse =
    | FetchMessageDetailsSuccessResponse
    | FetchMessageDetailsErrorResponse;
  
  
  
