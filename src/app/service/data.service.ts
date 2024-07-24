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

    public tickersData: Record<string, TickerData> = {
        'ASO': {
            ticker: 'ASO',
            description: 'ACADEMY SPORTS & OUTDOORS INC COM',
            transactions: []
        },
        'SBUX': {
            ticker: 'SBUX',
            description: 'STARBUCKS CORP COM',
            transactions: []
        }
    };

    public getTickerDataTransactions(ticker: string) {
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
        const totalNetPremium = putNetPremium + callNetPremium + totalDividend;

        const boughtSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'buy').reduce((sum, current) => sum + current.quantity!, 0);
        const soldSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'sell').reduce((sum, current) => sum + current.quantity!, 0);
        const sharesQty = boughtSharesQty - soldSharesQty;
        const sharesTrasactionsSum = transactions.filter(t => t.type === 'stock').reduce((sum, current) => sum + current.premium, 0);
        
        var pricePerShare =  0;
        if (sharesQty !== 0) {
           pricePerShare =  sharesTrasactionsSum / sharesQty;
        }
    
        if (pricePerShare < 0) {
          pricePerShare = pricePerShare * -1;
        }
    
        const openContracts = transactions.filter(t => t.closeDate === undefined || t.closeDate === null && (t.type === 'put' || t.type === 'call'));
        const optionsOnly = transactions.filter(t => t.type === 'put' || t.type === 'call');
    
        const risk = openContracts.reduce((sum, current) => sum + current.strike! * current.quantity! * 100, 0) + pricePerShare * sharesQty;
        const breakEven = (risk - totalNetPremium) / (openContracts.reduce((sum, current) => sum + current.quantity! * 100, 0) + sharesQty);
    
        const openDate = this.earliestOpenDate(optionsOnly)?.openDate!;
        const expirationDate = this.latestExpirationDate(openContracts)?.expiration!;
        //console.warn(openDate);
        //console.warn(expirationDate);
        const days = this.daysBetween(openDate, expirationDate);
    
        const period = days === 0 ? 1 : days;
        const annualizedReturn = (totalNetPremium / risk) * (365 / period);

        this.tickersData[ticker].summary = {
            putNetPremium: putNetPremium,
            callNetPremium: callNetPremium,
            totalNetPremium: totalNetPremium,
            sharesQty: sharesQty,
            pricePerShare: pricePerShare,
            risk: risk,
            breakEven: breakEven,
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

    private latestExpirationDate(transactions: Transaction[]) {
        return transactions.reduce((earliest, current) => {
            return earliest ? (new Date(earliest.expiration!).getTime() > new Date(current.expiration!).getTime() ? earliest : current) : current;
        }, null as Transaction | null);
    }

    private daysBetween(dateStr1: string, dateStr2: string): number {
        var date1: Date = new Date(dateStr1)
        var date2: Date = new Date(dateStr2)
        if (date1 === undefined || date2 === undefined)
            return 0;

        date2 = (date2.getTime() < new Date().getTime()) ? new Date() : date2;

        // Ensure date1 is before date2 for consistent calculation
        if (date1 > date2) {
            [date1, date2] = [date2, date1]; // Swap dates if needed
        }

        const diffInMs = date2.getTime() - date1.getTime(); // Milliseconds difference
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert to days and round down
    }

    constructor(private http: HttpClient) {
        Object.keys(this.tickersData).forEach(ticker => {
            this.getTickerDataTransactions(ticker);
            this.getTickerDataSummary(ticker);
        });
    }

    public notifyAboutTransactionsUpdate(ticker: string, transactions: Transaction[]) {
        console.warn('notify about transactions update data service is called: ' + ticker)
        const data: object = {
            ticker: ticker,
            transactions: transactions
        };
        this.dataUpdated.next(data);
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