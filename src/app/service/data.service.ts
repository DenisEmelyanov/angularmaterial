import { Injectable, Input } from "@angular/core";
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

    private transactionsServiceUrl = 'http://localhost:3000/transaction/';

    private transactionsUpdated = new BehaviorSubject<any>([]);
    public currentTransactions = this.transactionsUpdated.asObservable();

    constructor(private http: HttpClient) {
    }

    public notifyAboutTransactionsUpdate(ticker: string, transactions: Transaction[]) {
        console.warn('notify about transactions update data service is called')
        const data: object = {
            ticker: ticker,
            transactions: transactions
          };
        this.transactionsUpdated.next(data);
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

    deleteTransaction(transaction: Transaction): Observable<Transaction>  {
        console.warn('delete transaction: ' + transaction);
        return this.http.delete<Transaction>(this.transactionsServiceUrl + transaction.id).pipe<Transaction>(map((response: any) => response.data));
    }
}