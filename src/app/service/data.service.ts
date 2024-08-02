import { Injectable, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Transaction } from "../model/transaction";
import { TickerData } from "../model/ticker-data";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from "rxjs/internal/Observable";
import { SummaryData } from "../model/summary-data";
import { CalculationService } from "./calculation.service";

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private transactionsServiceUrl = 'http://localhost:3000/transaction/';

    private dataUpdated = new BehaviorSubject<any>([]);
    public currentData = this.dataUpdated.asObservable();

    private tickersDescription: Record<string, string> = {
        'ASO': 'ACADEMY SPORTS & OUTDOORS INC COM',
        'SBUX': 'STARBUCKS CORP COM',
        'NVDA': 'NVIDIA CORPORATION COM',
        'CVS': 'CVS HEALTH CORP COM',
        'DOCU': 'DOCUSIGN INC COM',
        'SSRM': 'SSR MINING IN COM',
        'INTC': 'INTEL CORP COM',
        'PZZA': 'PAPA JOHNS INTL INC COM',
        'TSLA': 'TESLA INC COM',
        'NEM': 'NEWMONT CORP COM',
        'GOOG': 'ALPHABET INC CAP STK CL C',
        'SNAP': 'SNAP INC CL A',
        'PYPL': 'PAYPAL HLDGS INC COM',
        'AMZN': 'AMAZON COM INC COM',
        'SQ': 'BLOCK INC CL A',
        'F': 'FORD MTR CO DEL COM'
    };

    private portfolio: any = 'individual portfolio';

    //private tickersData: Record<string, TickerData> = {};
    private yearsData: Record<number, Record<string, TickerData>> = {};

    constructor(private http: HttpClient, private calcService: CalculationService) {
        // get all years and update yearsData object
        this.getAllTransactionsYears().subscribe((years: any) => {
            years.forEach((year: number) => {
                this.refreshYearData(year);
            });
        });
    }

    private refreshYearData(year: number) {

        var tickersData: Record<string, TickerData> = {};
        this.getAllTransactionsTickers(year).subscribe((res: any) => {
            var tickers = Array.from(res);
            console.log('get the following tickers: ' + tickers);
            tickers.forEach((ticker: any) => {
                tickersData[ticker] = {
                    ticker: ticker,
                    description: this.tickersDescription[ticker],
                    year: year
                };
            });

            Object.keys(tickersData).forEach(ticker => {
                console.warn('update data for :' + ticker + ' ' + year);


                this.updateTickerData(ticker, year);
            });
            console.warn(tickersData);
        });

        this.yearsData[year] = tickersData;
    }

    public notifyAboutTransactionsUpdate(year: number, ticker: any = undefined) {
        console.warn('notify about transactions update data service is called: ' + ticker + ' ' + year);
        const data: object = {
            ticker: ticker,
            year: year
        };
        this.dataUpdated.next(data);
    }

    public getTickersData(year: any) {
        return this.yearsData[year];
    }

    public getAllTransactionsTickers(year: number) {
        return this.http
            .get(this.transactionsServiceUrl + 'tickers?year=' + year)
            .pipe(map((response: any) => response.data));
    }

    public getAllTransactionsYears() {
        return this.http
            .get(this.transactionsServiceUrl + 'years')
            .pipe(map((response: any) => response.data));
    }

    public updateTickerData(ticker: string, year: number) {
        this.getTickerTransactions(ticker, year).subscribe((res: any) => {
            console.warn('update ticker data is called: ' + ticker);

            this.yearsData[year][ticker].transactions = res;
            //this.tickersData[ticker].transactions = res;
            console.log(this.yearsData[year][ticker].transactions);

            this.yearsData[year][ticker].summary = this.calcService.calcSummary(this.yearsData[year][ticker].transactions!);

            this.notifyAboutTransactionsUpdate(year, ticker);
            return this.yearsData[year][ticker].transactions;
        });
    }

    public getTickerTransactions(ticker: string, year: number): Observable<Transaction[]> {
        return this.http
            .get(this.transactionsServiceUrl + '?ticker=' + ticker + '&year=' + year)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public updateTransaction(transaction: Transaction): Observable<Transaction> {

        // set portfolio
        transaction.portfolio = this.portfolio;
        // remove id
        const id = transaction.id;
        delete transaction.id;

        //  if (transaction.closeDate === null) {
        //       transaction.closeDate = '';
        // }
        if (transaction.type === 'stock') {
            delete transaction.strike;
            delete transaction.expiration;
        }

        if (transaction.type === 'dividend') {
            delete transaction.side;
            delete transaction.strike;
            delete transaction.quantity;
            delete transaction.expiration;
        }

        console.warn('update transaction: ' + id);
        console.warn(JSON.stringify(transaction));

        // update transaction
        return this.http.patch<Transaction>(this.transactionsServiceUrl + id, transaction);

    }

    public addTransaction(transaction: Transaction): Observable<Transaction> {
        // set portfolio
        transaction.portfolio = this.portfolio;
        // remove id
        const id = transaction.id;
        delete transaction.id;

        if (transaction.closeDate === null) {
            delete transaction.closeDate;
        }

        if (transaction.type === 'stock') {
            delete transaction.strike;
            delete transaction.expiration;
        }

        if (transaction.type === 'dividend') {
            delete transaction.side;
            delete transaction.strike;
            delete transaction.quantity;
            delete transaction.expiration;
        }

        console.warn('add transaction: ' + id);
        console.warn(JSON.stringify(transaction));
        // create transaction
        return this.http.post<Transaction>(this.transactionsServiceUrl, transaction).pipe<Transaction>(map((response: any) => response.data));
    }

    deleteTransaction(transaction: Transaction): Observable<Transaction> {
        console.warn('delete transaction: ' + transaction);
        return this.http.delete<Transaction>(this.transactionsServiceUrl + transaction.id).pipe<Transaction>(map((response: any) => response.data));
    }
}