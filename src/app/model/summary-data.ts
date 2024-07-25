export interface SummaryData {
    putNetPremium?: number;
    callNetPremium?: number;
    totalDividend?: number;
    totalNetPremium?: number;
    sharesQty?: number;
    pricePerShare?: number;
    sharesTotalNetPremium?: number;
    breakEven?: number;
    risk?: number;
    openDate: string;
    closeDate?: string;
    days?: number;
    annualizedReturn?: number;
}