import { Component, EventEmitter, Inject, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { Transaction } from 'src/app/model/transaction';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { DataService } from 'src/app/service/data.service';
import { FileSelectDialogComponent } from '../file-select-dialog/file-select-dialog.component';
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

  displayedColumns: string[] = ["transaction", "assigned", "openDate", "closeDate", "premium", "action"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService, private transactionDialog: MatDialog, private importDialog: MatDialog) {
  }

  ngOnInit() {
    console.warn(this.dataTicker)
    this.refreshTable();
  }

  refreshTable() {
    this.dataService.getTransactions(this.dataTicker.ticker).subscribe((res: any) => {
      console.warn(res);
      this.dataSource = res;

      this.dataService.notifyAboutTransactionsUpdate(this.dataTicker.ticker, res);
    });
    //this.dataSource = new MatTableDataSource<Transaction>(this.dataService.getTickerData(this.dataTicker).transactions);
  }

  deleteTransaction(transaction: Transaction) {
    this.dataService.deleteTransaction(transaction).subscribe((res: any) => {
      console.warn(res);
    });
    this.refreshTable();
  }

  editTransaction(transaction: Transaction) {
    this.openTransactionForm(transaction, 'Edit', TransactionFormComponent);
  }

  importTransactions() {
    this.openImportDialog();
    //this.downloadService.downloadJson(null, '');
  }

  addTransaction() {
    this.openTransactionForm(
      {
        id: -1,
        ticker: this.dataTicker.ticker,
        side: '',
        type: '',
        strike: 0,
        expiration: '',
        quantity: 0,
        premium: 0,
        openDate: '',
        assigned: false
      }, 'Add', TransactionFormComponent);
  }

  openImportDialog() {
    var _importDialogRef = this.importDialog.open(FileSelectDialogComponent);

    _importDialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        // Handle selected file here (e.g., read content, process data)
        console.log('Selected file:', result);
        const reader = new FileReader();
        reader.readAsText(result); // Or readAsDataURL for base64 data

        reader.onload = (e: any) => {
          const content = e.target.result;  // String representation of file content
          console.log('File content:', content);
          // Process the loaded content (e.g., parse JSON, display data)
          var transactions = JSON.parse(content) as Transaction[];
          transactions.forEach(transaction => {
            //console.warn(transaction);
            this.dataService.addTransaction(transaction).subscribe((res: any) => {
              console.warn(res);
            });
          });
          this.refreshTable();
        };

        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          // Handle errors (e.g., file type not supported)
        };
      }
    });
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

    _transactionFormRef.afterClosed().subscribe(transaction => {

      if (transaction !== null) {
        console.log('form submitted')
        console.log(transaction)
        if (transaction.id !== -1) {
          this.dataService.updateTransaction(transaction).subscribe((res: any) => {
            console.warn(res);
          });
        }
        else {
          this.dataService.addTransaction(transaction).subscribe((res: any) => {
            console.warn(res);
          });
        }
        this.refreshTable();
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
}

