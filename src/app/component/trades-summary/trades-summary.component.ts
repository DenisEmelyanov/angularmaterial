import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { TickerData } from 'src/app/model/ticker-data';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-trades-summary',
  templateUrl: './trades-summary.component.html',
  styleUrls: ['./trades-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradesSummaryComponent implements OnInit {
  @Input()
  dataTicker!: TickerData;

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
    this.dataService.currentData.subscribe((data: any) => {
      if (data.ticker === this.dataTicker.ticker) {
        const summaryData = this.dataService.tickersData[this.dataTicker.ticker].summary;
        this.putNetPremium = summaryData?.putNetPremium!;
        this.callNetPremium = summaryData?.callNetPremium!;
        this.totalNetPremium = summaryData?.totalNetPremium!;
        this.sharesQty = summaryData?.sharesQty!;
        this.pricePerShare = summaryData?.pricePerShare!;
        this.risk = summaryData?.risk!;
        this.breakEven = summaryData?.breakEven!;
        this.days = summaryData?.days!;
        this.annualizedReturn = summaryData?.annualizedReturn!;

        this.ref.detectChanges();
      }
    });
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
