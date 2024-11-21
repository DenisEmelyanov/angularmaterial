import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataService } from 'src/app/service/data.service';
import { TradesDetailsDialogComponent } from '../trades-details-dialog/trades-details-dialog.component';
import { Transaction } from 'src/app/model/transaction';

@Component({
  selector: 'app-trades-statistic-grid',
  templateUrl: './trades-statistic-grid.component.html',
  styleUrls: ['./trades-statistic-grid.component.css']
})
export class TradesStatisticGridComponent {

  dataSourceTradesByTickers: any;
  dataSourceTradesByYears: any;
  dataSourceTradesByMonths: any;
  dataSourceTransactionsByMonths: any;

  yearOptions: number[] = [];
  selectedYear: any;
  monthTrades: Record<string, Transaction[]> = {};
  monthTransactions: Record<string, Transaction[]> = {};

  displayedColumnsTradesByTickers: string[] = ["ticker", "description", "year", "totalNetPremium"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsTradesByYears: string[] = ["year", "totalNetPremium", "action"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsTradesByMonths: string[] = ["month", "chips", "totalNetPremium", "action"];
  displayedTransactionsColumnsByMonths: string[] = ["month", "totalNetPremium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService, private tradesDetailsDialog: MatDialog) {

  }

  ngOnInit() {
    this.dataService.currentData.subscribe((data) => {
      // get all years array
      this.populateTradesTickersTable();
      this.populateTradesTotalByYearTable();
      this.populateTradesTotalByMonthTable(this.selectedYear);
      this.populateTransactionsTotalByMonthTable(this.selectedYear);
    });
  }

  onYearDetails(year: any) {
    this.selectedYear = year;
    this.populateTradesTotalByMonthTable(this.selectedYear);
    this.populateTransactionsTotalByMonthTable(this.selectedYear);
  }

  onTradesMonthDetails(month: any) {
    this.openDetails('TRADES DETAILS ' + month + ' ' + this.selectedYear, ["transaction", "chips", "openDate", "openAmount", "closeDate", "closeAmount", "premium"], this.monthTrades[month], TradesDetailsDialogComponent);
  }

  onTransactionsMonthDetails(month: any) {
    this.openDetails('TRANSACTIONS DETAILS ' + month + ' ' + this.selectedYear, ["transaction", "chips", "openDate", "premium"], this.monthTransactions[month], TradesDetailsDialogComponent);
  }

  openDetails(title: string, columns: string[], transactions: Transaction[], component: any) {
    var _transactionFormRef = this.tradesDetailsDialog.open(component, {
      width: '40%',
      data: {
        title: title,
        columns: columns,
        transactions: transactions
      }
    });

    _transactionFormRef.afterClosed().subscribe(() => {
      //console.warn('Trades Details is closed');
    })
  }

  populateTradesTickersTable() {
    const tableDataArr: any[] = [];
    const tickerTotals: { [ticker: string]: number } = {};

    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);

    //console.warn('data analytics: ' + yearsArr);

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


    ////console.warn(tableDataArr);
    this.dataSourceTradesByTickers = new MatTableDataSource<any>(tableDataArr);
  }

  populateTradesTotalByYearTable() {
    const tableDataArr: any[] = [];
    let totalNetPremium = 0;

    const data = this.dataService.getAllYearsTickersData();
    const yearsArr = Object.keys(data).map(Number);
    this.selectedYear = yearsArr.sort((a, b) => b - a)[0];

    //console.warn('data analytics: ' + yearsArr);

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

    //console.warn(tableDataArr);
    this.dataSourceTradesByYears = new MatTableDataSource<any>(tableDataArr);
  }

  populateTradesTotalByMonthTable(year: number) {
    const tableDataArr: any[] = [];
    let totalOptionsNetPremium = 0;
    let totalStocksNetPremium = 0;

    const data = this.dataService.getGroupsDataByYear(year);

    const monthTotals: { [month: number]: number } = {};
    const monthTransactions: { [month: number]: Transaction[] } = {};

    for (const ticker in data) {
      const tickerData = data[ticker];
      if (tickerData.transactions) {
        for (const transaction of tickerData.transactions.filter(t => t.year === year)) {
          // calculate total premium from non-stock trades
          if (transaction.type !== 'stock' && transaction.type !== 'dividend') {
            const transactionDate = new Date(transaction.openDate);
            const month = transactionDate.getMonth() + 1; // Months are zero-indexed

            monthTotals[month] = (monthTotals[month] || 0) + transaction.premium;
            totalOptionsNetPremium += transaction.premium;

            monthTransactions[month] = monthTransactions[month] || [];
            monthTransactions[month].push(transaction);
          }
          // calculate premium from closed stock trades
          else if (transaction.closeDate !== null) {
            totalStocksNetPremium += transaction.premium;
          }
        }
      }
    }

    for (const month in monthTotals) {
      const monthStr = this.getMonthAbbreviation(parseInt(month));

      //save month transactions for details
      this.monthTrades[monthStr] = monthTransactions[month];
      const isOpen = monthTransactions[month].some(t => t.closeDate === null || t.closeDate === undefined);

      tableDataArr.push({
        month: monthStr,
        isOpen: isOpen,
        totalNetPremium: monthTotals[month]
      });
    }

    tableDataArr.sort(this.compareMonths);

    tableDataArr.push({
      month: 'TOTAL OPTIONS',
      totalNetPremium: totalOptionsNetPremium
    });

    tableDataArr.push({
      month: 'TOTAL STOCKS',
      totalNetPremium: totalStocksNetPremium
    });

    tableDataArr.push({
      month: 'TOTAL',
      totalNetPremium: totalOptionsNetPremium + totalStocksNetPremium
    });

    this.dataSourceTradesByMonths = new MatTableDataSource<any>(tableDataArr);
  }

  populateTransactionsTotalByMonthTable(year: number) {
    const tableDataArr: any[] = [];
    let totalOptionsNetPremium = 0;
    let totalStocksNetPremium = 0;

    const data = this.dataService.getGroupsDataByYear(year);

    const monthTotals: { [month: number]: number } = {};
    const monthTransactions: { [month: number]: Transaction[] } = {};
    const transactionsArr: Transaction[] = [];

    for (const ticker in data) {
      const tickerData = data[ticker];
      if (tickerData.transactions) {
        for (const transaction of tickerData.transactions.filter(t => t.year === year)) {
          // calculate total premium from non-stock trades
          if (transaction.type === 'call' || transaction.type === 'put') {
            const openTransaction: Transaction = {
              ticker: transaction.ticker,
              type: transaction.type,
              quantity: transaction.quantity,
              strike: transaction.strike,
              expiration: transaction.expiration,
              premium: transaction.openAmount!,
              openSide: transaction.openSide,
              openDate: transaction.openDate,
              assigned: false
            }
            transactionsArr.push(openTransaction);

            if (transaction.closeDate !== null) {
              const closeTransaction: Transaction = {
                ticker: transaction.ticker,
                type: transaction.type,
                quantity: transaction.quantity,
                strike: transaction.strike,
                expiration: transaction.expiration,
                premium: transaction.closeAmount!,
                openSide: transaction.closeSide,
                openDate: transaction.closeDate!,
                assigned: transaction.assigned
              }
              transactionsArr.push(closeTransaction);
            }
          }
          else if (transaction.closeDate !== null) {
            transactionsArr.push(transaction);
          }
        }
      }
    }

    for (const transaction of transactionsArr) {
      const openMonth = this.getMonthFromString(transaction.openDate); // Months are zero-indexed

      monthTotals[openMonth] = (monthTotals[openMonth] || 0) + transaction.premium;

      if (transaction.type === 'call' || transaction.type === 'put') {
        totalOptionsNetPremium += transaction.premium;
      }
      else {
        totalStocksNetPremium += transaction.premium;
      }

      monthTransactions[openMonth] = monthTransactions[openMonth] || [];
      monthTransactions[openMonth].push(transaction);
    }

    for (const month in monthTotals) {
      const monthStr = this.getMonthAbbreviation(parseInt(month));

      //save month transactions for details
      this.monthTransactions[monthStr] = monthTransactions[month];

      tableDataArr.push({
        month: monthStr,
        totalNetPremium: monthTotals[month]
      });
    }

    tableDataArr.sort(this.compareMonths);

    tableDataArr.push({
      month: 'TOTAL OPTIONS',
      totalNetPremium: totalOptionsNetPremium
    });

    tableDataArr.push({
      month: 'TOTAL STOCKS',
      totalNetPremium: totalStocksNetPremium
    });

    tableDataArr.push({
      month: 'TOTAL',
      totalNetPremium: totalOptionsNetPremium + totalStocksNetPremium
    });

    this.dataSourceTransactionsByMonths = new MatTableDataSource<any>(tableDataArr);
  }

  getMonthFromString(dateString: string): number {
    const parts = dateString.split('-');
    return parseInt(parts[1], 10);
  }

  getMonthAbbreviation(monthNumber: number): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthNumber - 1];
  }

  compareMonths(a: { month: string }, b: { month: string }): number {
    const monthMap: { [key: string]: number } = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
    };
    return monthMap[b.month] - monthMap[a.month];
  }

  public getBackgroundColor(value: string) {
    if (value.toString().includes('TOTAL'))
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
