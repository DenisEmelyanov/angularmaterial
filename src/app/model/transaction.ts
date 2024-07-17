export interface Transaction {
    id: number;
    ticker: string;
    type: string;
    strike : number;
    expiration : Date;
    side : string;
    quantity: number;
    premium : number;
    openDate : Date;
    closeDate : Date | undefined;
    active: string
}