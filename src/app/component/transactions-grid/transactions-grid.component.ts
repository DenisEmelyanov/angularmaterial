import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { Transaction } from 'src/app/model/transaction';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { TransactionService } from 'src/app/service/transactions.service';
import { DataService } from 'src/app/service/data.service';


@Component({
  selector: 'app-transactions-grid',
  templateUrl: './transactions-grid.component.html',
  styleUrls: ['./transactions-grid.component.css']
})

export class TransactionsGridComponent {
  @Input()
  dataTicker!: string;
  @Output()
  tableDataUpdated = new EventEmitter();

  // transactionsList!: Transaction[];
  dataSource: any;
  displayedColumns: string[] = ["transaction", "openDate", "closeDate", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private service: TransactionService, private dataService: DataService, private dialog: MatDialog) {
  }

  ngOnInit() {
    console.warn(this.dataTicker)
    this.refreshTable();
  }

  refreshTable() {
    this.tableDataUpdated.emit(this.dataTicker);
    this.dataService.updateTransactions();
    this.dataSource = new MatTableDataSource<Transaction>(this.service.getTransactions(this.dataTicker));
  }

  deleteTransaction(id: any) {
    this.service.deleteTransaction(id);

    this.refreshTable();
  }
  
  editTransaction(id: any) {
    this.openTransactionForm(id, 'Edit', TransactionFormComponent);
  }

  addTransaction() {
    this.openTransactionForm(this.service.getNewTransactionId(), 'Add', TransactionFormComponent);
  }

  openTransactionForm(id: any, title: any, component: any) {

    var _transactionForm = this.dialog.open(component, {
      width: '40%',
      data: {
        title: title,
        id: id,
        ticker: this.dataTicker
      }
    });

    _transactionForm.afterClosed().subscribe(item => {
      console.log('form submitted')
      console.log(item)
      this.refreshTable();
    })
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}
