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

export interface SocialMediaLeadUpdateData {
  name: string,
  email: string, 
  phone: string, 
  text: string, 
  remarks: string
}

export interface SocialMediaLeadFilters {
  source: string, 
  page: number, 
  size: number, 
  isConverted: boolean
}

  