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

    private ticker: string = "SBUX";
    tickersData: TickerData[] = jsonData;

    constructor(private http: HttpClient) { 
        //this.printJson();
    }
    
    public tickerTransactions = new BehaviorSubject<Transaction[]>(this.getTickerData(this.ticker).transactions);
    currentTransactions = this.tickerTransactions.asObservable();

    public notifyAboutTransactionsUpdate() {
        console.warn('notify about transactions update data service is called')
        var transactions = this.getTickerData(this.ticker).transactions;
        console.warn(transactions.length);
        this.tickerTransactions.next(transactions);
    }

    public getTransactions(ticker: string): Observable<Transaction[]> {
        return this.http
      .get(this.serviceUrl)
      .pipe<Transaction[]>(map((data: any) => data.data));
    }

    public getTickerData(ticker: string) {
        var tickerData = this.tickersData.filter(i => i.ticker === ticker);
        return tickerData[0];
    }

    updateTransaction(transaction : Transaction) {
        console.warn('update transaction: ' + transaction);
        var tickerUpdatedData = this.getTickerData(this.ticker);
        if (transaction.id !== -1) {
            var index = tickerUpdatedData.transactions.findIndex(t => t.id === transaction.id);
            console.warn(index);
            tickerUpdatedData.transactions[index] = transaction;
        }
        else {
            transaction.id = this.getNewTransactionId();
            tickerUpdatedData.transactions.push(transaction);
        }

        Object.assign(this.tickersData, tickerUpdatedData);
        this.saveJson();
    }

    deleteTransaction(transaction : Transaction) {
        console.warn('delete transaction: ' + transaction);
        var tickerUpdatedData = this.getTickerData(this.ticker);
        tickerUpdatedData.transactions = tickerUpdatedData.transactions.filter(t => t.id !== transaction.id);
        Object.assign(this.tickersData, tickerUpdatedData);
        this.saveJson();
      }

    getNewTransactionId() {
        return this.getTickerData(this.ticker).transactions.reduce((max, current) => {
            return Math.max(max, current.id);
          }, 0) + 1;
    }

    //private subject = new BehaviorSubject<Transaction[]>(this.service.getTransactions(this.ticker));

    //transactions$: Observable<Transaction[]> = this.subject.asObservable();
 
    //loadTransactions() {
    //    this.subject.next(this.service.getTransactions(this.ticker));
    //}
    public saveJson() {
        const jsonString = JSON.stringify(this.tickersData);
        console.log(jsonString);
    }
}