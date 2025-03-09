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
import { callback, isNullOrUndef } from 'chart.js/dist/helpers/helpers.core';
import { DatePipe } from '@angular/common';
import { Quote } from 'src/app/model/quote';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { Point } from 'chart.js/dist/core/core.controller';
import { animation, group } from '@angular/animations';

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
  openSharesProfitLoss!: number;
  risk!: number;
  breakEven!: number;
  days!: number;
  closeDate!: string;
  annualizedReturn!: number;

  calculatedPremium: number = 0;
  newPremium: number = 0;
  displayNewPremium: boolean = false;

  tradesData: Transaction[] = [];
  openPositions: Transaction[] = [];

  displayedColumns: string[] = ["selected", "transaction", "chips", "year", "openDate", "closeDate", "openAmount", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  timelineChart: any;
  priceChart: any;
  premiumChart: any;

  selectedTicker: any;
  tickerOptions: any;

  constructor(private dataService: DataService, private calcService: CalculationService, private ref: ChangeDetectorRef, private transactionDialog: MatDialog) {
  }

  ngOnInit() {
    /*     this.dataService.currentData.subscribe((data: any) => {
          if (data.group === this.dataTicker.group && data.year === this.dataTicker.year) {
            
          }
        }); */

    // update trades grid
    this.updatePageData();
  }

  createPriceChart(dataSource: Quote[], trades: Transaction[], canvasId: string) {
    if (dataSource !== undefined) {
      if (Chart.getChart(canvasId)) {
        Chart.getChart(canvasId)!.destroy();
      }
      console.log(dataSource);
      // filter by ticker
      const chartData = this.getPriceChartData(dataSource, trades.filter(t => t.ticker === this.selectedTicker));
      const labels = chartData.labels;
      const data = chartData.data;
      const breakEven = chartData.breakEven;
      const ticker = this.selectedTicker;

      const dataset: any = [];
      // push price data
      dataset.push({
        label: ticker + ' price',
        data: data,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 0,
        order: 3
      });

      dataset.push({
        label: 'break even',
        data: breakEven,
        backgroundColor: 'rgb(200, 29, 174, 0.1)',
        borderColor: 'rgb(200, 29, 174, 0.5)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0,
        order: 2
      });
      console.log(breakEven);

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

  createPremiumChart(dataSource: Transaction[], canvasId: string) {
    if (dataSource !== undefined) {
      if (Chart.getChart(canvasId)) {
        Chart.getChart(canvasId)!.destroy();
      }

      const chartData = this.getPremiumChartData(dataSource);

      const maxYValue = Math.max(...chartData.data);
      // find the latest value
      const lastValue = chartData.data[chartData.data.length - 1];

      return new Chart(canvasId, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
        label: 'premium (total: $' + lastValue.toFixed(2) + ')',
        data: chartData.data,
        fill: true,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgb(153, 102, 255, 0.2)',
        tension: 0.0,
        pointBackgroundColor: 'rgb(153, 102, 255, 0.5)',
        pointBorderWidth: 3,
        pointHitRadius: 6,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(153, 102, 255, 0.5)',
        pointRadius: (context: any) => {
          if (context.dataIndex !== 0) {
            const previousValue = context.dataset.data[context.dataIndex - 1];
            const currentData = context.dataset.data[context.dataIndex];
            const isValueChanged = currentData !== previousValue;
            return isValueChanged ? 6 : 0; // Larger radius for changed values
          } else {
            return 0;
          }
        }
          }]
        },
        options: {
          scales: {
        y: {
          ticks: {
            // Add dollar sign prefix to y-axis labels
            callback: (tickValue: string | number) => `$${Math.round(Number(tickValue))}`, // Round to nearest integer
          },
          max: Math.ceil((maxYValue + maxYValue * 0.1)/50) * 50,
        }
          }
        },
      });
    }

    return null;
  }

  getPremiumChartData(dataSource: Transaction[]) {
    const earliestOpenDate = this.calcService.earliestOpenDate(dataSource)?.openDate!;
    let latestCloseDate = this.calcService.latestCloseDate(dataSource)?.closeDate!;

    const optionsOnly = dataSource.filter(t => t.type === 'put' || t.type === 'call');
    // get open contracts, if no, then get transactions with latest close date
    const openContracts = optionsOnly.filter(t => t.closeDate === undefined || t.closeDate === null);
    const openStocks = dataSource.filter(t => t.type === 'stock' && t.openSide === 'buy' && (t.closeDate === undefined || t.closeDate === null));

    if (openContracts.length === 0 && openStocks.length !== 0) {
      latestCloseDate = new Date().toISOString().split('T')[0];
    } else if (openContracts.length !== 0) {
      latestCloseDate = this.calcService.latestExpirationDate(dataSource)?.expiration!;
    }

    // remove transactions with type =  stock and closeDate is null
    const filteredTransactions = dataSource.filter(t => !(t.type === 'stock' && t.openSide === 'buy'));

    const diffInDays = differenceInDays(latestCloseDate!, earliestOpenDate) + 5;
    const labels: string[] = [''];
    let premiumData: number[] = [0];
    let totalPremium = 0;

    for (let i = 0; i <= diffInDays; i++) {
      const currentDate = addDays(earliestOpenDate, i);
      // find transaction where open date equals to currentDate
      const openedTransactions = filteredTransactions.filter(t => t.openDate === format(currentDate, 'yyyy-MM-dd'));
      const closedTransactions = filteredTransactions.filter(t => t.closeDate === format(currentDate, 'yyyy-MM-dd'));

      if (openedTransactions.length !== 0) {
        // add up all premiums
        openedTransactions.forEach((t: Transaction) => {
          totalPremium += t.openAmount!;
        });
      }

      if (closedTransactions.length !== 0) {
        // add up all premiums
        closedTransactions.forEach((t: Transaction) => {
          if (t.type !== 'dividend') {
            totalPremium += t.closeAmount!;
          }
          else {
            // use premium for dividend transactions
            totalPremium += t.premium!;
          }

        });
      }

      premiumData.push(totalPremium);
      labels.push(format(currentDate, 'MMM d').toUpperCase());
    }

    return {
      labels: labels,
      data: premiumData
    }
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

    const breakEven: number[] = [];
    originalLabels.forEach((label: any) => {
      breakEven.push(this.breakEven);
    });

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
          price = this.calcService.calcStockPrice(trade.premium, trade.openAmount!, trade.quantity!);
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
      breakEven: breakEven,
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
        const label = trade.openSide + ' ' + trade.quantity + ' ' + trade.ticker + ' @ $' + this.calcService.calcStockPrice(trade.premium, trade.openAmount, trade.quantity);

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
    const date = new Date(dateString + "T00:00:00");

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


  updatePageData() {
    this.dataService.getAllGroupTransactions(this.dataTicker.group).subscribe((res: any) => {
      console.warn(res);
      this.tradesData = this.sortByOpenDate(res);

      // update summary
      const summaryData = this.calcService.calcSummary(this.tradesData);
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

      this.openPositions = res.filter((t: Transaction) => t.closeDate === null || t.closeDate === undefined);

      // get open date for group
      console.warn(this.dataTicker);
      const tickerData: TickerData = this.dataTicker;
      console.warn(tickerData);

      if (tickerData.tickers) {
        this.tickerOptions = ("" + tickerData.tickers).split(',').map(t => t.trim());
        this.selectedTicker = this.tickerOptions[0];
      }

      this.applyTickerForPriceChart();

      // TODO update group data????
      this.dataService.updateGroupData(this.dataTicker.group, this.dataTicker.year!);

      // create chart
      if (!Chart.getChart("timeline-chart")) {
        this.timelineChart = this.createTimelineChart(this.tradesData, "timeline-chart");
      }

      if (!Chart.getChart("premium-chart")) {
        this.premiumChart = this.createPremiumChart(this.tradesData, "premium-chart");
      }

      // update summary
      this.ref.detectChanges();
    });

  }

  applyTickerForPriceChart() {
    if (this.selectedTicker) {
      const ticker = this.selectedTicker;

      const openDate = this.calcService.earliestOpenDate(this.tradesData)?.openDate;
      const openDateWeekAgo = this.subDays(new Date(openDate!), -7).toISOString().split('T')[0];

      let closeDate = new Date().toISOString().split('T')[0];
      if (this.openPositions.length === 0) {
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
      this.dataService.getQuoteRange(ticker, openDateWeekAgo!, closeDate).subscribe((quotes: Quote[]) => {
        if (quotes) {
          console.warn(quotes);

          this.priceChart = this.createPriceChart(quotes, this.tradesData, 'price-chart');

          if (quotes.length > 0) {
            this.marketPrice = quotes[quotes.length - 1].close!;
            this.marketPriceDate = quotes[quotes.length - 1].date;

            const openStockPositions = this.openPositions.filter((t: Transaction) => t.type === 'stock' && t.ticker === this.selectedTicker);
            const openCallOptions = this.openPositions.filter((t: Transaction) => t.type === 'call' && t.ticker === this.selectedTicker);
            if (openStockPositions.length > 0) {
              this.openSharesProfitLoss = this.calcService.calcOpenSharesProfitLoss(openStockPositions, openCallOptions, this.marketPrice);
            }

            // update summary
            this.ref.detectChanges();
          }
        }
      });
    }
  }

  applyTicker(event: any) {
    console.log("selected ticker:" + event.value);
    this.selectedTicker = event.value;
    this.applyTickerForPriceChart();
  }

  refreshMarketPrice() {
    this.dataService.getQuote(this.selectedTicker, this.marketPriceDate, true).subscribe((quote: Quote) => {
      if (quote) {
        this.applyTickerForPriceChart();
      }
    });
  }

  calcSelectedTradesPremium(element: Transaction, selected: boolean) {
    if (selected) {
      if (element.closeDate === undefined || element.closeDate === null) {
        this.displayNewPremium = true;
      }

      this.calculatedPremium += element.premium;
      if (element.closeDate !== undefined && element.closeDate !== null) {
        this.newPremium += element.closeAmount!;
      } else {
        this.newPremium += element.openAmount!;
      }
    }
    else {
      if (element.closeDate === undefined || element.closeDate === null) {
        this.displayNewPremium = false;
      }
      
      this.calculatedPremium -= element.premium;
      if (element.closeDate !== undefined && element.closeDate !== null) {
        this.newPremium -= element.closeAmount!;
      } else {
        this.newPremium -= element.openAmount!;
      }
    }

    this.newPremium = parseFloat(this.newPremium.toFixed(2));
    this.calculatedPremium = parseFloat(this.calculatedPremium.toFixed(2));
  }

  sortByOpenDate(data: Transaction[]): Transaction[] {
    return data.sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());
  }

  deleteTransaction(transaction: Transaction) {
    this.dataService.deleteTransaction(transaction).subscribe((res: any) => {
      //console.warn(res);
      this.updatePageData();
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
        ticker: this.dataTicker.ticker,
        group: this.dataTicker.group
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
              this.updatePageData();
            });

          }
          else {
            this.dataService.addTransaction(t).subscribe((res: any) => {
              console.warn(res);
              this.updatePageData();
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
    return this.calcService.calcStockPrice(premium, amount, qty);
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
