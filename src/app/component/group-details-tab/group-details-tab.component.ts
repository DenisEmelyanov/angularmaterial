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
  risk!: number;
  breakEven!: number;
  days!: number;
  closeDate!: string;
  annualizedReturn!: number;

  tradesData: any;

  displayedColumns: string[] = ["transaction", "chips", "year", "openDate", "closeDate", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  timelineChart: any;

  constructor(private dataService: DataService, private calcService: CalculationService, private ref: ChangeDetectorRef, private transactionDialog: MatDialog) {
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

        // update summary
        this.ref.detectChanges();
      }
    });

    // update trades grid
    this.refreshTable();


  }

  createTimelineChart(dataSource: Transaction[], canvasId: string) {
    if (dataSource !== undefined) {
      const chartData = this.getChartData(dataSource);

      const stackedBar = new Chart(canvasId, {
        type: 'bar',
        data: {
          //labels: ['4 F Nov 15, 2024 $11 P', '2 F Oct 18, 2024 $10 P', '2 F Oct 18, 2024 $11 P', '4 F Sep 20, 2024 $11 P'],
          labels: chartData.labels,
          datasets: [
            {
              label: '',
              data: chartData.datasetBlanks, //[87, 49, 49, 0],
              backgroundColor: 'rgba(54, 162, 235, 0.0)',
            },
            {
              label: 'days',
              data: chartData.datasetDays,//[22, 33, 30, 49],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
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
              ticks: {
                autoSkip: false // Force all ticks to be shown
              }
            }
          }
        }
      });
    }
  }

  getChartData(dataSource: Transaction[]) {
    const labels: any[] = [];
    const datasetBlanks: any[] = [];
    const datasetDays: any[] = [];

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
      datasetDays: datasetDays
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

  refreshTable() {
    this.dataService.getAllGroupTransactions(this.dataTicker.group).subscribe((res: any) => {
      //console.warn(res);
      this.tradesData = this.sortByOpenDate(res);

      this.dataService.updateGroupData(this.dataTicker.group, this.dataTicker.year!);

      // create chart
      if (!Chart.getChart("timeline-chart")) {
        this.timelineChart = this.createTimelineChart(this.tradesData, "timeline-chart");
      }
    });

    //this.dataService.getTickerTransactions(this.dataTicker.group, this.dataTicker.year!).subscribe((res: any) => {
    //console.warn(res);
    //  this.dataSource = this.sortByOpenDate(res);

    //  this.dataService.updateTickerData(this.dataTicker.group, this.dataTicker.year!);
    //});


    ////this.dataSource = new MatTableDataSource<Transaction>(this.dataService.getTickerData(this.dataTicker).transactions);
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
