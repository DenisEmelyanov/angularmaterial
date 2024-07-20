import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Transaction } from "../model/transaction";
import { TickerData } from "../model/ticker-data";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import jsonData from 'src/app/data/data.json';
import { Observable } from "rxjs/internal/Observable";

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private serviceUrl = 'http://localhost:3000/transaction/';

    //private ticker: string = "SBUX";
    //tickersData: TickerData[] = jsonData;

    constructor(private http: HttpClient) {
        //this.printJson();
    }

    //public tickerTransactions = new BehaviorSubject<Transaction[]>(this.getTickerData(this.ticker).transactions);
    //currentTransactions = this.tickerTransactions.asObservable();

    public notifyAboutTransactionsUpdate(ticker: string) {
        console.warn('notify about transactions update data service is called')
        //var transactions = this.getTickerData(ticker).transactions;
        //console.warn(transactions.length);
        //this.tickerTransactions.next(transactions);
    }

    public getTransactions(ticker: string): Observable<Transaction[]> {
        return this.http
            .get(this.serviceUrl + '?ticker=' + ticker)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    // public getTickerData(ticker: string) {
    //     var tickerData = this.tickersData.filter(i => i.ticker === ticker);
    //     return tickerData[0];
    // }

    public updateTransaction(transaction: Transaction): Observable<Transaction> {

        // remove id
        const id = transaction.id;
        delete transaction.id;

        //  if (transaction.closeDate === null) {
        //       transaction.closeDate = '';
        // }

        console.warn('update transaction: ' + id);
        console.warn(JSON.stringify(transaction));

        // update transaction
        //return this.http.patch<Transaction>(this.serviceUrl + id, JSON.stringify(transaction)).pipe<Transaction>(map((response: any) => response.data));
        return this.http.patch<Transaction>(this.serviceUrl + id, transaction);

    }

    public addTransaction(transaction: Transaction): Observable<Transaction> {
        // remove id
        const id = transaction.id;
        delete transaction.id;

        if (transaction.closeDate === null) {
        delete transaction.closeDate;
    }
        console.warn('add transaction: ' + id);
        console.warn(JSON.stringify(transaction));
        // create transaction
        return this.http.post<Transaction>(this.serviceUrl, transaction).pipe<Transaction>(map((response: any) => response.data));
    }

    deleteTransaction(transaction: Transaction): Observable<Transaction>  {
        console.warn('delete transaction: ' + transaction);
        return this.http.delete<Transaction>(this.serviceUrl + transaction.id).pipe<Transaction>(map((response: any) => response.data));
    }
}