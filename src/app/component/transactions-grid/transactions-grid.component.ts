import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { Transaction } from 'src/app/model/transaction';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { DataService } from 'src/app/service/data.service';
import { TickerData } from 'src/app/model/ticker-data';


@Component({
  selector: 'app-transactions-grid',
  templateUrl: './transactions-grid.component.html',
  styleUrls: ['./transactions-grid.component.css']
})

export class TransactionsGridComponent {
  @Input()
  dataTicker!: TickerData;

  dataSource: any;

  displayedColumns: string[] = ["transaction", "chips", "openDate", "closeDate", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService, private transactionDialog: MatDialog) {
  }

  ngOnInit() {
    //console.warn(this.dataTicker)
    this.refreshTable();
  }

  refreshTable() {
    this.dataService.getTickerTransactions(this.dataTicker.ticker, this.dataTicker.year!).subscribe((res: any) => {
      //console.warn(res);
      this.dataSource = this.sortByOpenDate(res);

      this.dataService.updateTickerData(this.dataTicker.ticker, this.dataTicker.year!);
    });
    //this.dataSource = new MatTableDataSource<Transaction>(this.dataService.getTickerData(this.dataTicker).transactions);
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
    this.openTransactionForm(
      {
        id: -1,
        ticker: this.dataTicker.ticker,
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
          if (t.id !== -1) {
            this.dataService.updateTransaction(t).subscribe((res: any) => {
              //console.warn(res);
              this.refreshTable();
            });

          }
          else {
            this.dataService.addTransaction(t).subscribe((res: any) => {
              //console.warn(res);
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

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }

  getAbs(value: number) {
    return Math.abs(value);
  }
}

