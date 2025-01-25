import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataService } from 'src/app/service/data.service';
import { TradesDetailsDialogComponent } from '../trades-details-dialog/trades-details-dialog.component';
import { Transaction } from 'src/app/model/transaction';
import { Chart } from 'chart.js/auto';
import { ChartData } from 'chart.js';
import { CalculationService } from 'src/app/service/calculation.service';
import { of } from 'rxjs';
import { Quote } from 'src/app/model/quote';
import { forkJoin } from 'rxjs'; // Import forkJoin - Preferred method for this scenario
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-trades-statistic-grid',
  templateUrl: './trades-statistic-grid.component.html',
  styleUrls: ['./trades-statistic-grid.component.css']
})
export class TradesStatisticGridComponent {

  dataSourceTradesByTickers: any;
  dataSourceTradesByYears: any;
  dataSourceOpenStockPositions: any;
  dataSourceTradesByMonths: any;
  dataSourceTransactionsByMonths: any;

  yearOptions: number[] = [];
  selectedYear: any;
  monthTrades: Record<string, Transaction[]> = {};
  yearOptionsTrades: Transaction[] = [];
  yearClosedStockTrades: Transaction[] = [];
  monthTransactions: Record<string, Transaction[]> = {};

  tradesChart: any;
  transactionsChart: any;

  displayedColumnsTradesByTickers: string[] = ["ticker", "description", "year", "totalNetPremium"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsTradesByYears: string[] = ["year", "totalNetPremium", "action"];//"closeDate", "total net premium", "annualized return", 
  displayedColumnsTradesByMonths: string[] = ["month", "chips", "totalNetPremium", "action"];
  displayedTransactionsColumnsByMonths: string[] = ["month", "totalNetPremium", "action"];
  openStockPositionsColumns: string[] = ["ticker", "qty", "price", "lastMarketPrice", "profitLoss", "action"];

  //@ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService, private tradesDetailsDialog: MatDialog, private calcService: CalculationService, private elementRef: ElementRef) {

  }

  ngOnInit() {

    this.dataService.currentData.subscribe((data) => {
      console.log('dataLoad: ' + data.dataLoad);
      if (data.dataLoad !== undefined && data.dataLoad === false) {
        // get all years array
        this.populateTradesTickersTable();
        this.populateTradesTotalByYearTable();

        this.populateTradesTotalByMonthTableAndChart(this.selectedYear);
        this.populateTransactionsTotalByMonthTableAndChart(this.selectedYear);
      }
    });


    this.populateOpenStockPositionsTable();
  }

  createChart(dataSource: MatTableDataSource<any>, canvasId: string) {

    const chartData = this.getChartData(dataSource);
    //const median = this.createArrayWithSameNumbers(this.calcService.calculateMedian(chartData.dataset), chartData.dataset.length);
    let htmlRef = this.elementRef.nativeElement.querySelector('#' + canvasId);
    if (Chart.getChart(htmlRef)) {
      Chart.getChart(htmlRef)!.destroy();
    }
    const chart = new Chart(htmlRef, {
      type: 'bar', //this denotes tha type of chart

      data: {// values on X-Axis
        labels: chartData.labels,
        datasets: [
          {
            label: "Premium",
            data: chartData.dataset,
            backgroundColor: chartData.backgroundColors,
            borderColor: chartData.borderColors,
            borderWidth: 1
          }/* ,
          {
            label: 'Median',
            data: [median],
            type: 'line',
          } */
        ]
      },
      options: {
        responsive: true,
        aspectRatio: 1.3,
        scales: {
          y: {
            max: chartData.maxY,
            min: chartData.minY
          }
        }
      }
    });

    return chart;
  }

  // TODO - remove this method
  updateChart(chart: Chart, dataSource: MatTableDataSource<any>) {
    const chartData = this.getChartData(dataSource);

    if (chart && chart.data) {
      chart.data.labels = chartData.labels;
      chart.data.datasets.forEach(ds => {
        ds.data = chartData.dataset;
        ds.backgroundColor = chartData.backgroundColors;
        ds.borderColor = chartData.borderColors;
      });
      chart.options.scales = {
        y: {
          max: chartData.maxY,
          min: chartData.minY
        }
      };

      chart.update();
    }
  }

  getChartData(dataSource: MatTableDataSource<any>) {
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels: any[] = [];
    const dataset: any[] = [];
    const backgroundColors: any[] = [];
    const borderColors: any[] = [];
    var maxY = 0;
    var minY = -500;

    // Create a map to store data by month index (0-11)
    const monthlyDataMap = new Map<number, number>();

    dataSource.filteredData
      .filter((row: any) => row.month && !row.month.includes("TOTAL")) // Ensure row.month exists and doesn't include "TOTAL"
      .forEach((row: any) => {
        // Try to parse the month. If it's a number use it as index. If it's a string, try to find the index in monthLabels
        const monthIndex = monthLabels.findIndex(month => row.month.toLowerCase().includes(month.toLowerCase()));

        if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12) {
          monthlyDataMap.set(monthIndex, row.totalNetPremium);
        } else {
          console.warn(`Invalid month value: ${row.month}. Skipping this row.`);
        }
      });

    // Iterate through all months and create labels and data
    monthLabels.forEach((month, index) => {
      labels.push(month);
      const premium = monthlyDataMap.get(index) ?? 0; // Use 0 if no data for the month
      dataset.push(premium);

      if (premium >= 0) {
        backgroundColors.push('rgba(54, 162, 235, 0.2)');
        borderColors.push('rgb(54, 162, 235)');
      } else {
        backgroundColors.push('rgba(255, 99, 132, 0.2)');
        borderColors.push('rgb(255, 99, 132)');
      }

      if (premium > maxY) {
        maxY = premium;
      }

      if (premium < minY) {
        minY = premium;
      }
    });

    /*     dataSource.filteredData
          .filter((row: any) => row.month.includes("TOTAL") === false)
          .forEach((row: any) => {
            labels.push(row.month);
            dataset.push(row.totalNetPremium);
            if (row.totalNetPremium >= 0) {
              backgroundColors.push('rgba(54, 162, 235, 0.2)');
              borderColors.push('rgb(54, 162, 235)');
            }
            else {
              backgroundColors.push('rgba(255, 99, 132, 0.2)');
              borderColors.push('rgb(255, 99, 132)');
            }
            if (row.totalNetPremium > maxY) {
              maxY = row.totalNetPremium;
            }
    
            if (row.totalNetPremium < minY) {
              minY = row.totalNetPremium;
            }
          }); */

    /*     labels.reverse();
        dataset.reverse();
        backgroundColors.reverse();
        borderColors.reverse();
     */
    return {
      labels: labels,
      dataset: dataset,
      backgroundColors: backgroundColors,
      borderColors: borderColors,
      maxY: Math.round(maxY / 500) * 500 + 500,
      minY: Math.round(minY / 500) * 500 - 500
    }
  }

  createArrayWithSameNumbers(number: number, count: number): number[] {
    return Array.from({ length: count }, () => number);
  }

  onYearDetails(year: any) {
    this.selectedYear = year;
    this.populateTradesTotalByMonthTableAndChart(this.selectedYear);
    this.populateTransactionsTotalByMonthTableAndChart(this.selectedYear);
  }

  onTradesMonthDetails(month: any) {
    this.openDetails('TRADES DETAILS ' + month + ' ' + this.selectedYear, ["transaction", "chips", "openDate", "openAmount", "closeDate", "closeAmount", "premium"], this.monthTrades[month], TradesDetailsDialogComponent);
  }

  onOptionsTradesYearTotalDetails() {
    this.openDetails('OPTION TRADES DETAILS ' + this.selectedYear, ["transaction", "chips", "openDate", "openAmount", "closeDate", "closeAmount", "premium"], this.yearOptionsTrades, TradesDetailsDialogComponent);
  }

  onStockClosedTradesYearTotalDetails() {
    this.openDetails('STOCK TRADES DETAILS ' + this.selectedYear, ["transaction", "chips", "openDate", "openAmount", "closeDate", "closeAmount", "premium"], this.yearClosedStockTrades, TradesDetailsDialogComponent);
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

  populateOpenStockPositionsTable() {
    this.dataService.getOpenStockTransactions('', 'buy').pipe(
      map((res: Transaction[]) => res.filter(transaction => transaction.closeDate === null)),
      map((openTransactions: Transaction[]) => {
        const groupedTransactions = new Map<string, Transaction[]>();
        openTransactions.forEach(transaction => {
          if (!groupedTransactions.has(transaction.ticker!)) {
            groupedTransactions.set(transaction.ticker!, []);
          }
          groupedTransactions.get(transaction.ticker!)!.push(transaction);
        });
        return groupedTransactions;
      }),
      switchMap((groupedTransactions: Map<string, Transaction[]>) => {
        const positionsArr: any[] = [];

        groupedTransactions.forEach((transactions, ticker) => {
          let totalQuantity = 0;
          let totalOpenAmount = 0;
          let totalPremium = 0;

          transactions.forEach(transaction => {
            totalQuantity += transaction.quantity!;
            totalOpenAmount += transaction.openAmount ?? 0;
            totalPremium += transaction.premium;
          });

          const averagePrice = this.calcService.calcStockPrice(totalPremium, totalOpenAmount, totalQuantity);

          if (this.dataService.notInBlackList(ticker)) {
            positionsArr.push({
              ticker,
              qty: totalQuantity,
              price: averagePrice,
              lastMarketPrice: undefined,
              lastMarketDate: undefined,
              profitLoss: undefined
            });
          }
        });

        const quoteObservables = positionsArr.map(row =>
          this.dataService.getLatestQuote(row.ticker).pipe(
            catchError(error => {
              console.error(`Error fetching quote for ${row.ticker}:`, error);
              return of(undefined);
            })
          )
        );

        return forkJoin(quoteObservables).pipe(map(quotes => ({ positionsArr, quotes })));
      })
    ).subscribe(({ positionsArr, quotes }) => {

      quotes.forEach((quote, index) => {
        if (positionsArr[index] && quote) {
          positionsArr[index].lastMarketPrice = quote.close;
          positionsArr[index].lastMarketDate = quote.date;
          positionsArr[index].profitLoss = quote.close ? (quote.close - positionsArr[index].price) * positionsArr[index].qty : 0;
        }
      });

      positionsArr.sort((a, b) => a.ticker.localeCompare(b.ticker));
      this.dataSourceOpenStockPositions = new MatTableDataSource<any>(positionsArr);
    });
  }

  /*   populateOpenStockPositionsTable2() {
      const tableDataArr: any[] = [];
      const positionsArr: any[] = [];
      let completedQuotes = 0; // Track completed quote requests
  
      this.dataService.getOpenStockTransactions('', 'buy').subscribe((res) => {
        const openTransactions = res.filter(transaction => transaction.closeDate === null);
  
        const groupedTransactions = new Map<string, Transaction[]>();
        openTransactions.forEach(transaction => {
          if (!groupedTransactions.has(transaction.ticker!)) {
            groupedTransactions.set(transaction.ticker!, []);
          }
          groupedTransactions.get(transaction.ticker!)!.push(transaction);
        });
  
        // Calculate totals and averages for each ticker
        groupedTransactions.forEach((transactions, ticker) => {
          let totalQuantity = 0;
          let totalOpenAmount = 0;
          let totalPremium = 0;
  
          transactions.forEach(transaction => {
            totalQuantity += transaction.quantity!;
            totalOpenAmount += transaction.openAmount!;
            totalPremium += transaction.premium!;
          });
  
          const averagePrice = this.calcService.calcStockPrice(totalPremium, totalOpenAmount, totalQuantity);
          //console.log(ticker + ' ' + totalQuantity + ' ' + totalOpenAmount + ' ' + totalPremium + ' ' + averagePrice);
          positionsArr.push({
            ticker: ticker,
            qty: totalQuantity,
            price: averagePrice,
          });
        });
  
        positionsArr.forEach((row) => {
          //console.log(row);
          this.dataService.getLatestQuote(row.ticker).subscribe((quote: Quote) => {
            tableDataArr.push({
              ticker: row.ticker,
              qty: row.qty,
              price: row.price,
              lastMarketPrice: quote?.close,
              lastMarketDate: quote?.date,
              profitLoss: quote ? (quote.close! - row.price) * row.qty : 0,
            });
            completedQuotes++;
      
            // Check if all quotes have been received
            if (completedQuotes === groupedTransactions.size) {
              tableDataArr.sort((a, b) => a.ticker.localeCompare(b.ticker));
              this.dataSourceOpenStockPositions = new MatTableDataSource<any>(tableDataArr);
            }
          });
        });
      });
    } */

  populateTradesTotalByMonthTableAndChart(year: number) {
    const tableDataArr: any[] = [];
    let totalOptionsNetPremium = 0;
    let totalStocksNetPremium = 0;

    const data = this.dataService.getTickerDataByYear(year);

    const monthTotals: { [month: number]: number } = {};
    const monthTransactions: { [month: number]: Transaction[] } = {};
    const yearOptionsTrades: Transaction[] = [];
    const yearStocksClosedTrades: Transaction[] = [];

    this.dataService.getAllTransactionsForYear(year).subscribe((res: Transaction[]) => {
      const data = res.filter(t => this.dataService.notInBlackList(t.ticker!))
      .filter(t => this.getYearAndMonthFromString(t.openDate).year === year);

      for (const transaction of data) {
        if (transaction.type === 'stock' && transaction.closeDate === null) {
          // do nothing with open stock trades
        }
        else {
          const transactionDate = new Date(transaction.openDate + "T00:00:00");
          const month = transactionDate.getMonth() + 1; // Months are zero-indexed

          monthTotals[month] = (monthTotals[month] || 0) + transaction.premium;

          monthTransactions[month] = monthTransactions[month] || [];
          monthTransactions[month].push(transaction);

          if (transaction.type === 'call' || transaction.type === 'put') {
            totalOptionsNetPremium += transaction.premium;
            yearOptionsTrades.push(transaction);
          }
          // calculate premium from closed stock trades
          else if (transaction.closeDate !== null) {
            totalStocksNetPremium += transaction.premium;
            yearStocksClosedTrades.push(transaction);
          }
        }
      }

      for (const month in monthTotals) {
        const monthStr = this.getMonthAbbreviation(parseInt(month));

        //save month transactions for details
        this.monthTrades[monthStr] = monthTransactions[month];
        const isOpen = monthTransactions[month].some(t => t.closeDate === null || t.closeDate === undefined);
        //save closed stock trades for year details
        this.yearClosedStockTrades = yearStocksClosedTrades;
        this.yearOptionsTrades = yearOptionsTrades;

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

      this.tradesChart = this.createChart(this.dataSourceTradesByMonths, "trades-total-net-chart");
    });

    /* for (const ticker in data) {
      const tickerData = data[ticker];
      if (tickerData.transactions) {
        for (const transaction of tickerData.transactions.filter(t => t.year === year)) {
          // calculate total premium from non-stock trades
          //if (transaction.type !== 'stock' && transaction.type !== 'dividend') {



          if (transaction.type === 'stock' && transaction.closeDate === null) {
            // do nothing with open stock trades
          }
          else {
            const transactionDate = new Date(transaction.openDate);
            const month = transactionDate.getMonth() + 1; // Months are zero-indexed

            monthTotals[month] = (monthTotals[month] || 0) + transaction.premium;

            monthTransactions[month] = monthTransactions[month] || [];
            monthTransactions[month].push(transaction);

            if (transaction.type === 'call' || transaction.type === 'put') {
              totalOptionsNetPremium += transaction.premium;
              yearOptionsTrades.push(transaction);
            }
            // calculate premium from closed stock trades
            else if (transaction.closeDate !== null) {
              totalStocksNetPremium += transaction.premium;
              yearStocksClosedTrades.push(transaction);
            }
          }

          // else {
          //   yearStocksClosedTrades.push(transaction);
          // }
        }
      }
    }

    for (const month in monthTotals) {
      const monthStr = this.getMonthAbbreviation(parseInt(month));

      //save month transactions for details
      this.monthTrades[monthStr] = monthTransactions[month];
      const isOpen = monthTransactions[month].some(t => t.closeDate === null || t.closeDate === undefined);
      //save closed stock trades for year details
      this.yearClosedStockTrades = yearStocksClosedTrades;
      this.yearOptionsTrades = yearOptionsTrades;

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

    this.tradesChart = this.createChart(this.dataSourceTradesByMonths, "trades-total-net-chart"); */
  }

  populateTransactionsTotalByMonthTableAndChart(year: number) {
    const tableDataArr: any[] = [];
    let totalOptionsNetPremium = 0;
    let totalStocksNetPremium = 0;

    const monthTotals: { [month: number]: number } = {};
    const monthTransactions: { [month: number]: Transaction[] } = {};
    const transactionsArr: Transaction[] = [];

    //const data = this.dataService.getTickerDataByYear(year);
    this.dataService.getAllTransactionsForYear(year).subscribe((res: Transaction[]) => {
      const data = res.filter(t => this.dataService.notInBlackList(t.ticker!));
      for (const transaction of data) {
        
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

      //filter transactionss that are not in current year
      for (const transaction of transactionsArr.filter(t => this.getYearAndMonthFromString(t.openDate).year === year)) {
        const openMonth = this.getYearAndMonthFromString(transaction.openDate).month; // Months are zero-indexed
  
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

      this.transactionsChart = this.createChart(this.dataSourceTransactionsByMonths, "transactions-total-net-chart");
    });



    /* for (const ticker in data) {
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
    } */

    /* for (const transaction of transactionsArr) {
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

    this.dataSourceTransactionsByMonths = new MatTableDataSource<any>(tableDataArr); */
  }

  getYearAndMonthFromString(dateString: string): any {
    const parts = dateString.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10)
    };
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
    const checkDate = new Date(dateStr + "T00:00:00");

    // Handle invalid dates gracefully (optional)
    if (isNaN(checkDate.getTime())) {
      return false; // Or throw an error if you prefer
    }

    // Compare with today's date
    return checkDate.getTime() > today.getTime();
  }
}
