import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Observable } from "rxjs/internal/Observable";
import { Transaction } from "../model/transaction";
import { TransactionService } from "./transactions.service";
import { TickerData } from "../model/ticker-data";

@Injectable({
    providedIn: 'root'
  })
export class DataService {
    private ticker: string = "SBUX";

    constructor(private service: TransactionService) { 
    }
    
    public tickerData = new BehaviorSubject<Transaction[]>(this.service.getTransactions(this.ticker));
    currentTransactions = this.tickerData.asObservable();

    public updateTransactions() {
        console.warn('update transactions data service is called')
        var transactions = this.service.getTransactions(this.ticker);
        console.warn(transactions.length);
        this.tickerData.next(transactions);
    }
    //private subject = new BehaviorSubject<Transaction[]>(this.service.getTransactions(this.ticker));

    //transactions$: Observable<Transaction[]> = this.subject.asObservable();
 
    //loadTransactions() {
    //    this.subject.next(this.service.getTransactions(this.ticker));
    //}
}