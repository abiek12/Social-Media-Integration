import { leadStatus } from "../enums/lead.enums";

export interface LeadData {
    leadText: string;
    status: leadStatus; 
    contactEmail: string;
    contactName: string;
    subscriberId: number;
    companyName?: string;
    designation?: string;
    contactPhone?: string;
    contactCountry?: string;
    contactState?: string;
    contactCity?: string;
  }
  