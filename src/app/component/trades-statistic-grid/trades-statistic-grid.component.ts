import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TickerData } from 'src/app/model/ticker-data';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-trades-statistic-grid',
  templateUrl: './trades-statistic-grid.component.html',
  styleUrls: ['./trades-statistic-grid.component.css']
})
export class TradesStatisticGridComponent {

  dataSourceByTickers: any;
  dataSourceByYears: any;
  dataSourceByMonth: any;

  yearOptions: number[] = [];
  selectedYear: any;


  displayedColumnsByTickers: string[] = ["ticker", "description", "year", "totalNetPremium"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsByYears: string[] = ["year", "totalNetPremium", "action"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsByMonths: string[] = ["month", "totalNetPremium"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService) {

  }

  ngOnInit() {
    this.dataService.currentData.subscribe((data) => {
      // get all years array
      this.populateTickersTable();
      this.populateTotalByYearTable();
    });
  }

  onDetails(data: any) {
    this.selectedYear = data;
  }

  populateTickersTable() {
    const tableDataArr: any[] = [];
    const tickerTotals: { [ticker: string]: number } = {};
  
    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);
  
    console.warn('data analytics: ' + yearsArr);
  
    for (const year of yearsArr) {
      const yearTickersData = data[year];
  
      if (yearTickersData) {
        for (const ticker in yearTickersData) {
          const tickerData = yearTickersData[ticker];
          const totalNetPremium = tickerData.summary?.totalNetPremium || 0;
  
          tableDataArr.push({
            ticker: ticker,
            description: tickerData.description,
            year,
            totalNetPremium
          });
  
          tickerTotals[ticker] = (tickerTotals[ticker] || 0) + totalNetPremium;
        }
      }
    }
  
    // Add total rows for each ticker
    for (const ticker in tickerTotals) {
      tableDataArr.push({
        ticker: ticker + ' TOTAL',
        year: null, // Or any other value to indicate a total row
        totalNetPremium: tickerTotals[ticker]
      });
    }
  
    tableDataArr.sort((a, b) => {
      if (a.ticker !== b.ticker) {
        return a.ticker.localeCompare(b.ticker);
      } else {
        return b.year ? b.year - a.year : -1; // Sort total rows at the end
      }
    });

    // TODO remove ticker from total rows

  
    //console.warn(tableDataArr);
    this.dataSourceByTickers = new MatTableDataSource<any>(tableDataArr);
  }

  populateTable2() {
    const tableDataArr: any[] = [];

    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);

    console.warn('data analytics: ' + yearsArr);

    for (const year of yearsArr) {

      const yearTickersData = data[year];

      if (yearTickersData) {
        let yearTotalTickerNetPremium = 0;

        for (const ticker in yearTickersData) {
          const tickerData = yearTickersData[ticker];
          yearTotalTickerNetPremium += tickerData.summary?.totalNetPremium || 0; // Handle potential null or undefined

          tableDataArr.push({
            ticker,
            year,
            totalNetPremium: tickerData.summary?.totalNetPremium
          });
        }
      }
    }

    tableDataArr.sort((a, b) => {
      if (a.ticker !== b.ticker) {
        return a.ticker.localeCompare(b.ticker);
      } else {
        return b.year - a.year;
      }
    });

    console.warn(tableDataArr);
    this.dataSourceByTickers = new MatTableDataSource<any>(tableDataArr);
  }

  populateTotalByYearTable() {
    const tableDataArr: any[] = [];
    let totalNetPremium = 0;
  
    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);
    this.selectedYear = yearsArr.sort((a, b) => b - a)[0];
  
    console.warn('data analytics: ' + yearsArr);
  
    for (const year of yearsArr) {
      let yearTotalNetPremium = 0;
      const yearTickersData = data[year];
  
      if (yearTickersData) {
        for (const ticker in yearTickersData) {
          const tickerData = yearTickersData[ticker];
          yearTotalNetPremium += tickerData.summary?.totalNetPremium || 0; // Handle potential null or undefined
          totalNetPremium += tickerData.summary?.totalNetPremium || 0;
        }
  
        tableDataArr.push({
          year,
          totalNetPremium: yearTotalNetPremium
        });
      }
    }
  
    tableDataArr.push({
      year: 'TOTAL',
      totalNetPremium
    });
  
    tableDataArr.sort((a, b) => b.year - a.year);
  
    console.warn(tableDataArr);
    this.dataSourceByYears = new MatTableDataSource<any>(tableDataArr);
  }

  populateTableOld() {
    var tableDataArr: any[] = [];

    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);

    console.warn('data analytics: ' + yearsArr);
    Object.keys(yearsArr).forEach((year: any) => {
      var yearTotalNetPremium = 0;
      //skip unavailable years
      if (data[year] !== undefined) {
        const yearTickersData = data[year];
        Object.keys(yearTickersData).forEach((ticker) => {
          yearTotalNetPremium = yearTotalNetPremium + yearTickersData[ticker].summary?.totalNetPremium!;
        });

        tableDataArr.push({
          year: year,
          totalNetPremium: yearTotalNetPremium
        });
      }
    })
    console.warn(tableDataArr);

    //this.dataSource = tableDataArr;
    this.dataSourceByTickers = new MatTableDataSource<any>(tableDataArr);
  }

  public backGroundColor(value: string) {
    if (value.includes('TOTAL'))
      return "whitesmoke";
    else
      return "inherit";
  }

  public updateTotalRows(value: string) {
    if (value.includes('TOTAL'))
      return "TOTAL";
    else
      return value;  
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
