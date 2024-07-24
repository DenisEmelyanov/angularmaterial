import { SummaryData } from "./summary-data";
import { Transaction } from "./transaction";

export interface TickerData {
    ticker: string;
    description: string;
    transactions?: Transaction[];
    summary?: SummaryData;
}