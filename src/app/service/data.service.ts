import { Injectable, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Transaction } from "../model/transaction";
import { TickerData } from "../model/ticker-data";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from "rxjs/internal/Observable";
import { SummaryData } from "../model/summary-data";

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
        'CVS' : 'CVS HEALTH CORP COM',
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

    public tickersData: Record<string, TickerData> = {};

    constructor(private http: HttpClient) {
        this.getAllTransactionsTickers().subscribe((res: any) => {
            var tickers = Array.from(res);
            console.log('get the following tickers: ' + tickers);
            tickers.forEach((ticker: any) => {
                this.tickersData[ticker] = {
                    ticker: ticker,
                    description: this.tickersDescription[ticker]
                };
            });


            Object.keys(this.tickersData).forEach(t => {
                console.warn('update data for :' + t);
                this.updateTickerData(t);
            });
            console.warn(this.tickersData);
        });

    }

    public getAllTransactionsTickers() {
        return this.http
            .get(this.transactionsServiceUrl + 'tickers')
            .pipe(map((response: any) => response.data));
    }

    public notifyAboutTransactionsUpdate(ticker: string, transactions: Transaction[]) {
        console.warn('notify about transactions update data service is called: ' + ticker)
        const data: object = {
            ticker: ticker,
            transactions: transactions
        };
        this.dataUpdated.next(data);
    }

    public updateTickerData(ticker: string) {
        this.getTransactions(ticker).subscribe((res: any) => {
            console.warn('update ticker data is called: ' + ticker);
            this.tickersData[ticker].transactions = res;
            console.log(this.tickersData[ticker].transactions);
            this.getTickerDataSummary(ticker);

            this.notifyAboutTransactionsUpdate(ticker, res);
            return this.tickersData[ticker].transactions;
        });
    }

    public getTickerDataSummary(ticker: string) {

        const transactions = this.tickersData[ticker].transactions!;

        const putNetPremium = transactions.filter(t => t.type === 'put').reduce((sum, current) => sum + current.premium, 0);
        const callNetPremium = transactions.filter(t => t.type === 'call').reduce((sum, current) => sum + current.premium, 0);
        const totalDividend = transactions.filter(t => t.type === 'dividend').reduce((sum, current) => sum + current.premium, 0);
        
        const boughtSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'buy').reduce((sum, current) => sum + current.quantity!, 0);
        const soldSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'sell').reduce((sum, current) => sum + current.quantity!, 0);
        const sharesQty = boughtSharesQty - soldSharesQty;

        const sharesOpenTrasactionsPremium = transactions.filter(t => t.type === 'stock' && t.closeDate === null).reduce((sum, current) => sum + current.premium, 0);
        const sharesClosedTransactionsPremium = transactions.filter(t => t.type === 'stock' && t.closeDate !== null).reduce((sum, current) => sum + current.premium, 0);
        
        const totalNetPremium = putNetPremium + callNetPremium + totalDividend + sharesClosedTransactionsPremium;

        var pricePerShare = 0;
        if (sharesQty !== 0) {
            pricePerShare = sharesOpenTrasactionsPremium / sharesQty;
        }

        if (pricePerShare < 0) {
            pricePerShare = pricePerShare * -1;
        }

        const optionsOnly = transactions.filter(t => t.type === 'put' || t.type === 'call');
        // get open contracts, if no, then get transactions with latest close date
        const openContracts = optionsOnly.filter(t => t.closeDate === undefined || t.closeDate === null);
        var riskContracts = openContracts;
        if (openContracts.length === 0) {
            var riskContracts = this.getTransactionsWithLatestCloseDate(optionsOnly);
        }
        console.warn('risk contracts: ' + riskContracts.length);
        console.warn(riskContracts);

        var risk = 0;
        if (openContracts.length === 0 && sharesQty > 0) {
            // no open contracts, only shares
            risk = pricePerShare * sharesQty;
        }
        else { 
            risk = riskContracts.reduce((sum, current) => sum + current.strike! * current.quantity! * 100, 0) + pricePerShare * sharesQty;
        }

        console.warn('open shares qty: ' + sharesQty);

        var riskQty = 0;
        if (openContracts.length === 0 && sharesQty > 0) {
            riskQty = sharesQty;
        }
        else {
            riskQty = riskContracts.reduce((sum, current) => sum + current.quantity! * 100, 0) + sharesQty;
        }
        console.warn('risk qty: ' + riskQty);

        const breakEven = (risk - totalNetPremium) / riskQty;

        const openDate = this.earliestOpenDate(optionsOnly)?.openDate!;

        var expirationDate = this.latestExpirationDate(riskContracts)?.expiration!;
        if (openContracts.length === 0) {
            expirationDate = this.latestCloseDate(riskContracts)?.closeDate!
        }
        console.warn('open date: ' + openDate);
        console.warn('close date: ' + expirationDate);
        const days = this.daysDifference(openDate, expirationDate);

        const period = days === 0 ? 1 : days;
        const annualizedReturn = (totalNetPremium / risk) * (365 / period);

        this.tickersData[ticker].summary = {
            putNetPremium: putNetPremium,
            callNetPremium: callNetPremium,
            totalNetPremium: totalNetPremium,
            sharesQty: sharesQty,
            sharesTotalNetPremium: sharesClosedTransactionsPremium,
            pricePerShare: pricePerShare,
            risk: risk,
            breakEven: breakEven,
            openDate: openDate,
            closeDate: expirationDate,
            days: days,
            annualizedReturn: annualizedReturn
        }

        return this.tickersData[ticker].summary;
    }

    private earliestOpenDate(transactions: Transaction[]) {
        return transactions.reduce((earliest, current) => {
            return earliest ? (new Date(earliest.openDate).getTime() < new Date(current.openDate).getTime() ? earliest : current) : current;
        }, null as Transaction | null);
    }

    private getTransactionsWithLatestCloseDate(transactions: Transaction[]): Transaction[] {
        // Find the maximum close date timestamp
        const latestTimestamp = Math.max(...transactions.map(t => new Date(t.closeDate!).getTime()));

        // Filter transactions with the latest close date
        return transactions.filter(t => new Date(t.closeDate!).getTime() === latestTimestamp);
    }

    private latestCloseDate(transactions: Transaction[]) {
        return transactions.reduce((latest, current) => {
            return latest ? (new Date(latest.closeDate!).getTime() > new Date(current.closeDate!).getTime() ? latest : current) : current;
        }, null as Transaction | null);
    }

    private latestExpirationDate(transactions: Transaction[]) {
        return transactions.reduce((earliest, current) => {
            return earliest ? (new Date(earliest.expiration!).getTime() > new Date(current.expiration!).getTime() ? earliest : current) : current;
        }, null as Transaction | null);
    }

    daysDifference(date1: string, date2: string): number {
        // Create Date objects from the strings
        const dateObject1 = new Date(date1);
        const dateObject2 = new Date(date2);

        // Handle invalid dates gracefully (optional)
        if (isNaN(dateObject1.getTime()) || isNaN(dateObject2.getTime())) {
            return -1; // Or throw an error if you prefer
        }

        // Get the difference in milliseconds
        const timeDiff = Math.abs(dateObject1.getTime() - dateObject2.getTime());

        // Convert milliseconds to days and round down to the nearest whole day
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        return daysDiff;
    }

    public getTransactions(ticker: string): Observable<Transaction[]> {
        return this.http
            .get(this.transactionsServiceUrl + '?ticker=' + ticker)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public updateTransaction(transaction: Transaction): Observable<Transaction> {

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