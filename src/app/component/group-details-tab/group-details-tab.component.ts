import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TickerData } from 'src/app/model/ticker-data';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { Chart } from 'chart.js';
import { CalculationService } from 'src/app/service/calculation.service';
import { MatTableDataSource } from '@angular/material/table';
import { isNullOrUndef } from 'chart.js/dist/helpers/helpers.core';
import { DatePipe } from '@angular/common';
import { Quote } from 'src/app/model/quote';

@Component({
  selector: 'app-group-details-tab',
  templateUrl: './group-details-tab.component.html',
  styleUrls: ['./group-details-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupDetailsTabComponent {
  @Input()
  dataTicker!: TickerData;

  putNetPremium!: number;
  callNetPremium!: number;
  totalNetPremium!: number;
  sharesTotalNetPremium!: number;
  sharesQty!: number;
  pricePerShare!: number;
  marketPrice: number = 0;
  marketPriceDate: string = '';
  risk!: number;
  breakEven!: number;
  days!: number;
  closeDate!: string;
  annualizedReturn!: number;

  tradesData: any;

  displayedColumns: string[] = ["transaction", "chips", "year", "openDate", "closeDate", "openAmount", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  timelineChart: any;
  priceChart: any;

  constructor(private dataService: DataService, private calcService: CalculationService, private ref: ChangeDetectorRef, private transactionDialog: MatDialog) {
  }

  ngOnInit() {
    this.dataService.currentData.subscribe((data: any) => {
      if (data.group === this.dataTicker.group && data.year === this.dataTicker.year) {
        const tickerData = this.dataService.getGroupsDataByYear(this.dataTicker.year)[this.dataTicker.group];
        const summaryData = tickerData.summary;
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

        // if (tickerData?.quotes) {
        //   this.marketPrice = tickerData?.quotes[0].close!;
        //   this.marketPriceDate = tickerData?.quotes[0].date!;
        // }

        // update summary
        this.ref.detectChanges();
      }
    });

    // update trades grid
    this.refreshTable();
  }

  createPriceChart(dataSource: Quote[], trades: Transaction[], canvasId: string) {
    if (dataSource !== undefined) {
      console.log(dataSource);
      const chartData = this.getPriceChartData(dataSource, trades);
      const labels = chartData.labels;
      const data = chartData.data;
      const tradeData = chartData.tradesDataset[0];

      const dataset: any = [];
      // push price data
      dataset.push({
        label: 'price',
        data: data,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 0,
        order: 2
      });

      chartData.tradesDataset.forEach((tradeData: any) => {
        dataset.push({
          label: tradeData.label,
          data: tradeData.tradeData,
          fill: false,
          borderColor: 'rgb(' + tradeData.color + ')',
          backgroundColor: 'rgb(' + tradeData.color + ', 0.5)',
          tension: 0.4,
          pointBackgroundColor: 'rgb(' + tradeData.color + ', 0.9)',
          pointRadius: tradeData.tradeData.map((value: any, index: number) => {
            if (index === tradeData.index1 || index === tradeData.index2) {
              return 5; // Radius for first and last points
            } else {
              return 0; // Radius 0 for other points (effectively hides them)
            }
          }),
          order: 1
        });
      });

      return new Chart(canvasId, {
        type: 'line',
        data: {
          labels: labels,
          datasets: dataset
        },

      });
    }

    return null;
  }

  getPriceChartData(dataSource: Quote[], trades: Transaction[]) {
    const originalLabels = dataSource.map(q => q.date);

    const labels = dataSource.map(q => {
      const dateString = q.date; // Extract the date string
      const [year, month, day] = dateString.split('-').map(Number);
      const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthsArr[month - 1].toUpperCase()} ${day}`; // Reformat to "MM/DD"
    });

    const prices = dataSource.map(q => q.close);
    const tradesDataset: any = [];

    trades.reverse()
      .filter(t => t.type === 'put' || t.type === 'call' || (t.type === 'stock' && t.openSide === 'buy'))
      .forEach((trade: Transaction) => {
        const tradeData: any[] = [];

        const tradeOpenDate = new Date(trade.openDate);
        let tradeCloseDate = new Date();
        // check if trade is closed
        if (trade.closeDate !== undefined && trade.closeDate !== null) {
          tradeCloseDate = new Date(trade.closeDate);
        }
        let price = 0;
        let label = '';
        let color = '120, 75, 192';
        if (trade.type === 'put' || trade.type === 'call') {
          price = trade.strike!;
          label = trade.quantity + ' ' + this.formatDate(trade.expiration!) + ' $' + trade.strike + ' ' + trade.type;
          if (trade.type === 'call') {
            color = '255, 99, 132';
          }
        } else if (trade.type === 'stock') {
          price = this.calcStockPrice(trade.premium, trade.openAmount!, trade.quantity!);
          label = trade.openSide + ' ' + trade.quantity + ' ' + trade.ticker + ' @ $' + price;
          color = '255, 205, 86';
        }

        originalLabels.forEach((label: any) => {
          if (new Date(label) >= tradeOpenDate && new Date(label) <= tradeCloseDate) {
            tradeData.push(price);
          }
          else {
            tradeData.push(undefined);
          }
        });

        let firstNonUndefinedIndex = -1;
        let lastNonUndefinedIndex = -1;

        for (let i = 0; i < tradeData.length; i++) {
          if (tradeData[i] !== undefined) {
            if (firstNonUndefinedIndex === -1) {
              firstNonUndefinedIndex = i;
            }
            lastNonUndefinedIndex = i;
          }
        }

        tradesDataset.push({
          label: label.toUpperCase(),
          index1: firstNonUndefinedIndex,
          index2: lastNonUndefinedIndex,
          tradeData: tradeData,
          color: color
        });
      });

    return {
      labels: labels,
      data: prices,
      tradesDataset: tradesDataset
    }
  }

  createTimelineChart(dataSource: Transaction[], canvasId: string) {
    if (dataSource !== undefined) {
      const chartData = this.getTimelineChartData(dataSource);

      return new Chart(canvasId, {
        type: 'bar',
        data: {
          //labels: ['4 F Nov 15, 2024 $11 P', '2 F Oct 18, 2024 $10 P', '2 F Oct 18, 2024 $11 P', '4 F Sep 20, 2024 $11 P'],
          labels: chartData.labels,
          datasets: [
            {
              type: 'bar',
              label: '',
              data: chartData.datasetBlanks, //[87, 49, 49, 0],
              backgroundColor: 'rgba(54, 162, 235, 0.0)',
              yAxisID: 'y'
            },
            {
              type: 'bar',
              label: 'days',
              data: chartData.datasetDays,//[22, 33, 30, 49],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: '',//'Price'
              data: chartData.datasetPrice,
              borderColor: 'rgba(54, 162, 235, 0.0)',//'rgb(66, 235, 54)',
              backgroundColor: 'rgba(54, 162, 235, 0.0)',//'rgb(66, 235, 54, 0.2)',
              borderWidth: 1,
              yAxisID: 'y1',
            }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              display: true,
              position: 'left',
              ticks: {
                autoSkip: false // Force all ticks to be shown
              }
            },
            y1: {
              type: 'linear',
              display: false,
              position: 'right',

              // grid line settings
              grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
              }
            }
          }
        }
      });
    }

    return null;
  }

  getTimelineChartData(dataSource: Transaction[]) {
    const labels: any[] = [];
    const datasetBlanks: any[] = [];
    const datasetDays: any[] = [];
    const datasetPrice: any[] = [];

    const earliestOpenDate = this.calcService.earliestOpenDate(dataSource)?.openDate!;

    const optionsOnly = dataSource.filter(t => t.type === 'put' || t.type === 'call');
    // get open contracts, if no, then get transactions with latest close date
    const openContracts = optionsOnly.filter(t => t.closeDate === undefined || t.closeDate === null);

    var latestCloseDate = this.calcService.latestExpirationDate(dataSource)?.expiration;
    if (openContracts.length === 0) {
      latestCloseDate = new Date().toISOString().split('T')[0];
    }

    dataSource.forEach((trade: any) => {
      if (trade.type === 'put' || trade.type === 'call') {
        const label = trade.quantity + ' ' + this.formatDate(trade.expiration) + ' $' + trade.strike + ' ' + trade.type;

        const blankNumber = this.calcService.daysDifference(earliestOpenDate, trade.openDate);

        var closeDate = trade.expiration;
        if (trade.closeDate !== undefined && trade.closeDate !== null) {
          closeDate = trade.closeDate;
        }
        const daysNumber = this.calcService.daysDifference(trade.openDate, closeDate);

        labels.push(label.toUpperCase());
        datasetBlanks.push(blankNumber);
        datasetDays.push(daysNumber);
        datasetPrice.push(5);
      }
      else if (trade.type === 'stock' && trade.openSide === 'buy') {
        const label = trade.openSide + ' ' + trade.quantity + ' ' + trade.ticker + ' @ $' + this.calcStockPrice(trade.premium, trade.openAmount, trade.quantity);

        const blankNumber = this.calcService.daysDifference(earliestOpenDate, trade.openDate);

        if (trade.closeDate !== undefined && trade.closeDate !== null) {
          closeDate = trade.closeDate;
        }
        else {
          closeDate = latestCloseDate;
        }
        const daysNumber = this.calcService.daysDifference(trade.openDate, closeDate);

        labels.push(label.toUpperCase());
        datasetBlanks.push(blankNumber);
        if (daysNumber > 0) {
          datasetDays.push(daysNumber);
        }
        else {
          datasetDays.push(1);
        }
      }
    });

    return {
      labels: labels,
      datasetBlanks: datasetBlanks,
      datasetDays: datasetDays,
      datasetPrice: datasetPrice
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
  }

  getLastWorkingDay(startDate: Date): Date | null {
    let currentDate = new Date(startDate);

    for (let i = 1; i <= 7; i++) { // Check up to 7 days back (a full week)
      const previousDate = this.subDays(currentDate, -1);

      if (!this.isWeekend(previousDate)) {
        return previousDate;
      }
      currentDate = previousDate;
    }

    return null; // No working day found within the last week (unlikely, but possible with unusual holiday schedules)
  }

  subDays(date: Date, days: number): Date {
    const prevDate = new Date(date); // Create a copy of today's date
    prevDate.setDate(date.getDate() + days); // Subtract the number of days

    return prevDate;
  }

  isWeekend(date: Date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }


  refreshTable() {
    this.dataService.getAllGroupTransactions(this.dataTicker.group).subscribe((res: any) => {
      console.warn(res);
      this.tradesData = this.sortByOpenDate(res);

      const openPositions = res.filter((t: Transaction) => t.closeDate === null || t.closeDate === undefined);
      const stockPositions = openPositions.filter((t: Transaction) => t.type === 'stock');

      /*       stockPositions.forEach((t: Transaction) => {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              //const lastWorkingDayStr = this.getLastWorkingDay(today)?.toISOString().split('T')[0];
      
              this.dataService.getQuote(t.ticker!, todayStr!).subscribe((res: any) => {
                //console.warn(res);
                this.marketPrice = res[0].close;
                this.marketPriceDate = res[0].date;
              });
            }); */

      // get open date for group
      console.warn(this.dataTicker);
      const tickerData: TickerData = this.dataTicker;
      console.warn(tickerData);
      const ticker: string = ("" + tickerData.tickers).split(',')[0].trim(); // TODO get it for all tickers
      const openDate = this.calcService.earliestOpenDate(this.tradesData)?.openDate;
      const openDateWeekAgo = this.subDays(new Date(openDate!), -7).toISOString().split('T')[0];

      let closeDate = new Date().toISOString().split('T')[0];
      if (openPositions.length === 0) {
        closeDate = this.calcService.latestCloseDate(this.tradesData)?.closeDate!;
        const closeDatePlusWeek = this.subDays(new Date(closeDate), 7);
        if (closeDatePlusWeek > new Date()) {
          closeDate = new Date().toISOString().split('T')[0];
        }
        else {
          closeDate = closeDatePlusWeek.toISOString().split('T')[0];
        }
      }

      //const closeDate = tickerData.summary!.closeDate;
      console.warn(ticker + ' open date:' + openDate + '->' + openDateWeekAgo + ' close date: ' + closeDate);
      this.dataService.getQuoteRange(ticker, openDateWeekAgo!, closeDate).subscribe((res: Quote[]) => {
        if (res) {
          console.warn(res);
          if (!Chart.getChart("price-chart")) {
            this.priceChart = this.createPriceChart(res, this.tradesData, 'price-chart');
          }

          if (res.length > 0) {
            this.marketPrice = res[res.length - 1].close!;
            this.marketPriceDate = res[res.length - 1].date;
            // update summary
            this.ref.detectChanges();
          }
        }
      });

      this.dataService.updateGroupData(this.dataTicker.group, this.dataTicker.year!);

      // create chart
      if (!Chart.getChart("timeline-chart")) {
        this.timelineChart = this.createTimelineChart(this.tradesData, "timeline-chart");
      }

      // update summary
      this.ref.detectChanges();
    });

  }

  sortByOpenDate(data: Transaction[]): Transaction[] {
    return data.sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());
  }

  deleteTransaction(transaction: Transaction) {
    this.dataService.deleteTransaction(transaction).subscribe((res: any) => {
      //console.warn(res);
      this.refreshTable();
    });
  }

  editTransaction(transaction: Transaction) {
    this.openTransactionForm(transaction, 'Edit', TransactionFormComponent);
  }

  addTransaction() {
    // get ticker from the latest transaction
    const tickerData = this.tradesData[0];

    this.openTransactionForm(
      {
        id: -1,
        ticker: tickerData.ticker,
        openSide: '',
        type: '',
        strike: 0,
        expiration: '',
        quantity: 0,
        premium: 0,
        openDate: '',
        assigned: false
      }, 'Add', TransactionFormComponent);
  }

  openTransactionForm(transaction: Transaction, title: any, component: any) {
    var _transactionFormRef = this.transactionDialog.open(component, {
      width: '40%',
      data: {
        title: title,
        transaction: transaction,
        ticker: this.dataTicker.ticker
      }
    });

    _transactionFormRef.afterClosed().subscribe(transactions => {

      if (transactions !== null) {
        console.log('form submitted');
        console.log(transactions);
        transactions.forEach((t: Transaction) => {
          // transform dates
          t.expiration = this.formatDateToString(t.expiration);
          t.openDate = this.formatDateToString(t.openDate)!;
          t.closeDate = this.formatDateToString(t.closeDate);
          // convert strings to numbers
          t.premium = Number(t.premium);
          t.openAmount = Number(t.openAmount);
          t.closeAmount = Number(t.closeAmount);

          console.warn(t);

          if (t.id !== -1) {
            this.dataService.updateTransaction(t).subscribe((res: any) => {
              console.warn(res);
              this.refreshTable();
            });

          }
          else {
            this.dataService.addTransaction(t).subscribe((res: any) => {
              console.warn(res);
              this.refreshTable();
            });
          }
        });

      }
      else {
        console.log('form cancelled')
      }

    })
  }

  formatDateToString(dateStr: string | null | undefined): string | null {
    if (dateStr) {
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().padStart(4, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;

    } else {
      return null;
    }
  }

  calcStockPrice(premium: number, amount: number, qty: number) {
    if (amount) {
      return Math.abs(amount / qty);
    }
    else {
      return Math.abs(premium / qty);
    }
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
