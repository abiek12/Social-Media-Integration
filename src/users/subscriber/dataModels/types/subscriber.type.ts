export interface SubscriberBasicInfo {
    userName: string;
    company: string;
    email: string;
    contactNumber?: string;
    password: string;
    currency?: string;
}

export interface SubscriberRegInputData extends SubscriberBasicInfo{
    subscriberId?: number;
    subscriptionPlanId?: number;
    roc?: string;
    addressProof?: string;
    gst?: string;
    gstNumber?: string;
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
    address?: string;
    orderId?: string;
}