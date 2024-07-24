import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TickerData } from 'src/app/model/ticker-data';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-summary-grid',
  templateUrl: './summary-grid.component.html',
  styleUrls: ['./summary-grid.component.css']
})
export class SummaryGridComponent {

  @Output() 
  detailsClickEvent = new EventEmitter<TickerData>();

  dataSource: any;

  displayedColumns: string[] = ["ticker", "description", "totalNetPremium", "risk", "breakEven", "annualizedReturn", "action"];//"closeDate", "total net premium", "annualized return", 
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.dataService.currentData.subscribe(() => {
      const data = this.dataService.tickersData;
      var tableDataArr: any[] = [];
      Object.keys(data).forEach(ticker => {
        tableDataArr.push({
          ticker: ticker,
          description: data[ticker].description,
          risk: data[ticker].summary!.risk,
          totalNetPremium: data[ticker].summary!.totalNetPremium,
          breakEven: data[ticker].summary!.breakEven,
          annualizedReturn: data[ticker].summary!.annualizedReturn
        });
      })
      this.dataSource = tableDataArr;
    });
  }

  onDetails(data: any) {
    this.detailsClickEvent.emit(data);
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
