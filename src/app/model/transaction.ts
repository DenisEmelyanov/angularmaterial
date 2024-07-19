export interface Transaction {
    id?: number;
    ticker: string;
    type: string;
    strike : number;
    expiration : string;
    side : string;
    quantity: number;
    premium : number;
    openDate : string;
    closeDate? : string | null;
}