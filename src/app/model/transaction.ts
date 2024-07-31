export interface Transaction {
    id?: number;
    portfolio?: string;
    ticker: string;
    type: string;
    strike?: number;
    expiration?: string;
    side?: string;
    quantity?: number;
    premium: number;
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