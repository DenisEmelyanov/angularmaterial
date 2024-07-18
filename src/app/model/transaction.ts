export interface Transaction {
    id: number;
    type: string;
    strike : number;
    expiration : string;
    side : string;
    quantity: number;
    premium : number;
    openDate : string;
    closeDate? : string;
}