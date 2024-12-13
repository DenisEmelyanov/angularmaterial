import { Injectable, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Transaction } from "../model/transaction";
import { TickerData } from "../model/ticker-data";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from "rxjs/internal/Observable";
import { CalculationService } from "./calculation.service";
import { group, transition } from "@angular/animations";

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
        'F': 'FORD MTR CO DEL COM',
        'HAL': 'HALLIBURTON CO COM',
        'TROW': 'PRICE T ROWE GROUP INC COM',
        'JNJ': 'JOHNSON & JOHNSON COM',
        'SOUN': 'SOUNDHOUND AI INC CLASS A COM',
        'MO' : 'ALTRIA GROUP INC COM',
        'HL': 'HECLA MNG CO COM',
        'ABNB': 'AIRBNB INC COM CL A',
        'T': 'AT&T INC COM',
        'ENPH' : 'ENPHASE ENERGY INC COM',
        'SCHD' : 'SCHWAB US DIVIDEND EQUITY ETF'
    };

    private portfolio: any = 'individual portfolio';

    private blackList = ['META', 'BIG'];
    private notInBlackList(str: string)
    {
        var notInBlackList = true;
        this.blackList.forEach(blItem => {
            if (str.includes(blItem) === true) {
                notInBlackList = false;
            }
        });

        return notInBlackList;
    };

    //private tickersData: Record<string, TickerData> = {};
    private yearsGroupData: Record<number, Record<string, TickerData>> = {};
    private yearsTickerData: Record<number, Record<string, TickerData>> = {};
    private dataLoad: boolean = false;

    constructor(private http: HttpClient, private calcService: CalculationService) {
        // get all years and update yearsData object
        this.dataLoad = true;
        this.getAllTransactionsYears().subscribe((years: any) => {
            years.forEach((year: number) => {
                this.refreshYearData(year);
            });
            this.dataLoad = false;
        });
    }

    private refreshYearData(year: number) {

        var groupsData: Record<string, TickerData> = {};
        this.getAllTransactionsGroups(year).subscribe((res: any) => {
            var groups = Array.from(res);
            //console.log('get the following groups: ' + groups);
            groups.forEach((group: any) => {
                if (this.notInBlackList(group)) {
                    groupsData[group] = {
                        group: group,
                        tickers: [],
                        description: '',// TODO this.tickersDescription[group],
                        year: year
                    };
                }
            });

            Object.keys(groupsData).forEach(group => {
                //console.warn('update data for: ' + ticker + ' ' + year);


                this.updateGroupData(group, year);
            });
            //console.warn(tickersData);
        });

        this.yearsGroupData[year] = groupsData;

        var tickersData: Record<string, TickerData> = {};
        this.getAllTransactionsTickers(year).subscribe((res: any) => {
            var tickers = Array.from(res);
            //console.log('get the following tickers: ' + tickers);
            tickers.forEach((ticker: any) => {
                if (this.notInBlackList(ticker)) {
                    tickersData[ticker] = {
                        group: '',
                        ticker: ticker,
                        tickers: [],
                        description: this.tickersDescription[ticker],
                        year: year
                    };
                }
            });

            Object.keys(tickersData).forEach(ticker => {
                //console.warn('update data for: ' + ticker + ' ' + year);


                this.updateTickerData(ticker, year);
            });
            //console.warn(tickersData);
        });

        this.yearsTickerData[year] = tickersData;
    }

    public notifyAboutTransactionsUpdate(year: number, group: any = undefined) {
        //console.warn('notify about transactions update data service is called: ' + ticker + ' ' + year);
        const data: object = {
            group: group,
            year: year,
            dataLoad: this.dataLoad
        };
        this.dataUpdated.next(data);
    }

    public getAllYearsTickersData() {
        //console.log('getAllYearsTickersData called');
        //return this.yearsGroupData;
        return this.yearsTickerData;
    }

    public getAllYearsGroupsData() {
        //console.log('getAllYearsTickersData called');
        //return this.yearsGroupData;
        return this.yearsGroupData;
    }

    public getGroupsDataByYear(year: any) {
        return this.yearsGroupData[year];
    }

    public getAllTransactionsTickers(year: number) {
        return this.http
            .get(this.transactionsServiceUrl + 'tickers?year=' + year)
            .pipe(map((response: any) => response.data));
    }

    public getAllTransactionsGroups(year: number) {
        return this.http
            .get(this.transactionsServiceUrl + 'groups?year=' + year)
            .pipe(map((response: any) => response.data));
    }

    public getAllTransactionsYears() {
        return this.http
            .get(this.transactionsServiceUrl + 'years')
            .pipe(map((response: any) => response.data));
    }

    public updateGroupData(group: string, year: number) {
        this.getAllGroupTransactions(group).subscribe((res: any) => {
        //this.getGroupTransactions(group, year).subscribe((res: any) => {
            //console.warn('update ticker data is called: ' + ticker);

            // get tickers list for group
            const uniqueTickers = new Set(res.map((t: Transaction) => t.ticker));
            const uniqueTickersArray: string[] = Array.from(uniqueTickers) as string[];

            // filter group if there are transactions with year more than current
            if (res.filter((t: Transaction) => t.year! > year).length === 0) {
                this.yearsGroupData[year][group].transactions = res;
                this.yearsGroupData[year][group].tickers = uniqueTickersArray;
                //this.tickersData[ticker].transactions = res;
                //console.log(this.yearsGroupData[year][group].transactions);
                //console.log(this.yearsGroupData[year][group].tickers);
    
                // check if there is call options
                this.getAllGroupTransactions(group).subscribe((res: any) => {
                    //const sharesTransactions = res.filter((t: Transaction) => t.type === 'stock');//t.year! < year + 1);
                    this.yearsGroupData[year][group].summary = this.calcService.calcSummary(this.yearsGroupData[year][group].transactions!, year);//sharesTransactions, 
    
                    this.notifyAboutTransactionsUpdate(year, group);
                    return this.yearsGroupData[year][group].transactions;
                });
            }
        });
    }

    public updateTickerData(ticker: string, year: number) {
        this.getTickerTransactions(ticker, year).subscribe((res: any) => {
            this.yearsTickerData[year][ticker].transactions = res;
            this.yearsTickerData[year][ticker].summary = this.calcService.calcTotalNetPremium(res);
        //this.getGroupTransactions(group, year).subscribe((res: any) => {
            //console.warn('update ticker data is called: ' + ticker);

            // // get tickers list for group
            // const uniqueTickers = new Set(res.map((t: Transaction) => t.ticker));
            // const uniqueTickersArray: string[] = Array.from(uniqueTickers) as string[];

            // // filter group if there are transactions with year more than current
            // if (res.filter((t: Transaction) => t.year! > year).length === 0) {
            //     this.yearsGroupData[year][ticker].transactions = res;
            //     this.yearsGroupData[year][ticker].tickers = uniqueTickersArray;
            //     //this.tickersData[ticker].transactions = res;
            //     console.log(this.yearsGroupData[year][ticker].transactions);
            //     console.log(this.yearsGroupData[year][ticker].tickers);
    
            //     // check if there is call options
            //     this.getAllGroupTransactions(group).subscribe((res: any) => {
            //         const sharesTransactions = res.filter((t: Transaction) => t.year! < year + 1);
            //         this.yearsGroupData[year][group].summary = this.calcService.calcSummary(this.yearsGroupData[year][group].transactions!, sharesTransactions, year);
    
            //         this.notifyAboutTransactionsUpdate(year, group);
            //         return this.yearsGroupData[year][group].transactions;
            //     });
            // }
            
        });
    }

    public getGroupTransactions(group: string, year: number): Observable<Transaction[]> {
        return this.http
            .get(this.transactionsServiceUrl + '?group=' + group + '&year=' + year)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public getTickerTransactions(ticker: string, year: number): Observable<Transaction[]> {
        return this.http
            .get(this.transactionsServiceUrl + '?ticker=' + ticker + '&year=' + year)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public getAllGroupTransactions(group: string) {
        return this.http
            .get(this.transactionsServiceUrl + '?group=' + group)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public getAllStockTransactions(ticker: string) {
        return this.http
            .get(this.transactionsServiceUrl + '?ticker=' + ticker)
            .pipe<Transaction[]>(map((response: any) => response.data));
    }

    public getOpenStockTransactions(ticker: string, openSide: string) {
        return this.http
            .get(this.transactionsServiceUrl + '?ticker=' + ticker + '&type=stock&openSide=' + openSide)
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
            delete transaction.openSide;
            delete transaction.strike;
            delete transaction.quantity;
            delete transaction.expiration;
        }

        //console.warn('update transaction: ' + id);
        //console.warn(JSON.stringify(transaction));

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
            delete transaction.openSide;
            delete transaction.strike;
            delete transaction.quantity;
            delete transaction.expiration;
        }

        //console.warn('add transaction: ' + id);
        console.warn(JSON.stringify(transaction));
        // create transaction
        return this.http.post<Transaction>(this.transactionsServiceUrl, transaction).pipe<Transaction>(map((response: any) => response.data));
    }

    deleteTransaction(transaction: Transaction): Observable<Transaction> {
        //console.warn('delete transaction: ' + transaction);
        return this.http.delete<Transaction>(this.transactionsServiceUrl + transaction.id).pipe<Transaction>(map((response: any) => response.data));
    }
}