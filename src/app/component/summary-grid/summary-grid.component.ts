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

  displayedColumns: string[] = ["ticker", "description", "chips", "totalNetPremium", "openDate", "closeDate", "risk", "breakEven", "annualizedReturn", "action"];//"closeDate", "total net premium", "annualized return", 
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
          sharesQty: data[ticker].summary!.sharesQty,
          totalNetPremium: data[ticker].summary!.totalNetPremium,
          openDate: data[ticker].summary!.openDate,
          closeDate: data[ticker].summary!.closeDate,
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

  isFutureDate(dateStr: string): boolean {
    // Create Date objects
    const today = new Date();
    const checkDate = new Date(dateStr);
  
    // Handle invalid dates gracefully (optional)
    if (isNaN(checkDate.getTime())) {
      return false; // Or throw an error if you prefer
    }
  
    // Compare with today's date
    return checkDate.getTime() > today.getTime();
  }
  
}
