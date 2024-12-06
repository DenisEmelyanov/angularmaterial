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
  sharesTotalNetPremium!: number;
  sharesQty!: number;
  pricePerShare!: number;
  risk!: number;
  breakEven!: number;
  days!: number;
  closeDate!: string;
  annualizedReturn!: number;

  constructor(private dataService: DataService, private ref: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.dataService.currentData.subscribe((data: any) => {
      if (data.ticker === this.dataTicker.ticker && data.year === this.dataTicker.year) {
        const summaryData = this.dataService.getGroupsDataByYear(this.dataTicker.year)[this.dataTicker.group].summary;
        this.putNetPremium = summaryData?.putNetPremium!;
        this.callNetPremium = summaryData?.callNetPremium!;
        this.totalNetPremium = summaryData?.totalNetPremium!;
        this.sharesTotalNetPremium = summaryData?.sharesTotalNetPremium!;
        this.sharesQty = summaryData?.sharesQty!;
        this.pricePerShare = summaryData?.pricePerShare!;
        this.risk = summaryData?.risk!;
        this.breakEven = summaryData?.breakEven!;
        this.days = summaryData?.days!;
        this.closeDate = summaryData?.closeDate!;
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
