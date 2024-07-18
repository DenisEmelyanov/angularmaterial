import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Transaction } from "../model/transaction";
import { TransactionService } from "./transactions.service";
import { TickerData } from "../model/ticker-data";
import data from 'src/app/data/data.json';

@Injectable({
    providedIn: 'root'
  })
export class DataService {
    private ticker: string = "SBUX";
    tickersData: TickerData[] = data;

    constructor(private service: TransactionService) { 
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
    }

    deleteTransaction(transaction : Transaction) {
        console.warn('delete transaction: ' + transaction);
        var tickerUpdatedData = this.getTickerData(this.ticker);
        tickerUpdatedData.transactions = tickerUpdatedData.transactions.filter(t => t.id !== transaction.id);
        Object.assign(this.tickersData, tickerUpdatedData);
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
    public printJson() {
        const jsonString = JSON.stringify(this.tickersData);
        console.log(jsonString);
    }
}