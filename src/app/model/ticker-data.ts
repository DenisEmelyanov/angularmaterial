import { Transaction } from "./transaction";

export interface TickerData {
    ticker: string;
    transactions: Transaction[];
}