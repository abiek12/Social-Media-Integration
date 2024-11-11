import { leadStatus } from "../enums/lead.enums";

export interface LeadData {
    leadText: string;
    status: leadStatus; 
    contactEmail: string;
    contactName: string;
    companyName: string | null;
    designation: string | null;
    subscriberId: number;
    contactPhone: string | null;
    contactCountry: string | null;
    contactState: string | null;
    contactCity: string | null;
  }
  