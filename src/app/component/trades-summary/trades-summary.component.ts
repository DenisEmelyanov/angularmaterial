import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-trades-summary',
  templateUrl: './trades-summary.component.html',
  styleUrls: ['./trades-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradesSummaryComponent {
  @Input()
  dataTicker!: string;

  putNetPremium!: number;
  callNetPremium!: number;
  totalNetPremium!: number;
  sharesQty!: number;
  pricePerShare!: number;
  risk!: number;
  breakEven!: number;
  days!: number;
  annualizedReturn!: number;

  constructor(private dataService: DataService, private ref: ChangeDetectorRef) {
  }

  ngOnInit() {
    // get transactions using BehaviorSubject, not API call
    this.dataService.currentTransactions.subscribe((data: any) => {
      if (data.ticker === this.dataTicker) {
        this.calcSummary(data.transactions);
        this.ref.detectChanges();
      }
    });
  }

  calcSummary(transactions: Transaction[]) {
    console.warn('calc summary is called: ' + this.dataTicker);
    console.warn(transactions.length);

    this.putNetPremium = transactions.filter(t => t.type === 'put').reduce((sum, current) => sum + current.premium, 0);
    this.callNetPremium = transactions.filter(t => t.type === 'call').reduce((sum, current) => sum + current.premium, 0);
    var totalDividend = transactions.filter(t => t.type === 'dividend').reduce((sum, current) => sum + current.premium, 0);
    this.totalNetPremium = this.putNetPremium + this.callNetPremium + totalDividend;

    const boughtSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'buy').reduce((sum, current) => sum + current.quantity!, 0);
    const soldSharesQty = transactions.filter(t => t.type === 'stock' && t.side === 'sell').reduce((sum, current) => sum + current.quantity!, 0);
    this.sharesQty = boughtSharesQty - soldSharesQty;
    const sharesTrasactionsSum = transactions.filter(t => t.type === 'stock').reduce((sum, current) => sum + current.premium, 0);
    this.pricePerShare =  sharesTrasactionsSum / this.sharesQty;
    if (this.pricePerShare < 0) {
      this.pricePerShare = this.pricePerShare * -1;
    }

    var openContracts = transactions.filter(t => t.closeDate === undefined || t.closeDate === null && (t.type === 'put' || t.type === 'call'));

    this.risk = openContracts.reduce((sum, current) => sum + current.strike! * current.quantity! * 100, 0) + this.pricePerShare * this.sharesQty;
    this.breakEven = (this.risk - this.totalNetPremium) / (openContracts.reduce((sum, current) => sum + current.quantity! * 100, 0) + this.sharesQty);

    var openDate = this.earliestOpenDate(transactions)?.openDate!;
    var expirationDate = this.latestExpirationDate(openContracts)?.expiration!;
    //console.warn(openDate);
    //console.warn(expirationDate);
    this.days = this.daysBetween(openDate, expirationDate);

    var period = this.days === 0 ? 1 : this.days;
    this.annualizedReturn = (this.totalNetPremium / this.risk) * (365 / period);
  }

  earliestOpenDate(transactions: Transaction[]) {
    return transactions.reduce((earliest, current) => {
      return earliest ? (new Date(earliest.openDate).getTime() < new Date(current.openDate).getTime() ? earliest : current) : current;
    }, null as Transaction | null);
  }

  latestExpirationDate(transactions: Transaction[]) {
    return transactions.reduce((earliest, current) => {
      return earliest ? (new Date(earliest.expiration!).getTime() > new Date(current.expiration!).getTime() ? earliest : current) : current;
    }, null as Transaction | null);
  }

  daysBetween(dateStr1: string, dateStr2: string): number {
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

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
