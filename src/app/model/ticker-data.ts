import { Transaction } from "./transaction";

export interface TickerData {
    ticker: string;
    description: string
    transactions?: Transaction[];
}