import { Quote } from "./quote";
import { SummaryData } from "./summary-data";
import { Transaction } from "./transaction";

export interface TickerData {
    ticker?: string;
    tickers: string[];
    quotes?: Quote[];
    description: string;
    group: string;
    transactions?: Transaction[];
    summary?: SummaryData;
    year?: number;
}