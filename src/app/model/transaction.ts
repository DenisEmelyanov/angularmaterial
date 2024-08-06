export interface Transaction {
    id?: number;
    portfolio?: string;
    ticker: string;
    type: string;
    strike?: number;
    expiration?: string;
    side?: string;
    closeSide?: string;
    quantity?: number;
    premium: number;
    openAmount?: number;
    closeAmount?: number;
    openDate: string;
    closeDate?: string | null;
    year?: number;
    group?: string;
    assigned: boolean;
}

enum TransactionType {
    Call = "call",
    Put = "put",
    Stock = "stock",
    Dividend = "dividend",
    Interest = "interest",
}