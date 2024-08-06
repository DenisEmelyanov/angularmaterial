import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { Transaction } from 'src/app/model/transaction';
import { group } from '@angular/animations';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TransactionFormComponent implements OnInit {
  inputData: any;
  editData: any;
  transactionForm: any;
  selectedType: any;

  stockOpenTrades: Transaction[] = [];
  tableDataSource: any;
  displayedColumns: string[] = ["select", "transaction", "openDate", "closeDate", "premium"];
  selected_trade_ids: number[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<PopupComponent>, private formBuilder: FormBuilder, private dataService: DataService) {
    this.transactionForm = this.formBuilder.group({
      id: this.formBuilder.control(this.data.transaction.id),
      ticker: this.formBuilder.control(this.data.ticker),
      openSide: this.formBuilder.control(''),
      closeSide: this.formBuilder.control(''),
      quantity: this.formBuilder.control(1),
      type: this.formBuilder.control(''),
      strike: this.formBuilder.control(''),
      expiration: this.formBuilder.control(null),
      premium: this.formBuilder.control(''),
      openAmount: this.formBuilder.control(''),
      closeAmount: this.formBuilder.control(''),
      openDate: this.formBuilder.control(null),
      closeDate: this.formBuilder.control(null),
      year: this.formBuilder.control(new Date().getFullYear()),
      group: this.formBuilder.control(''),
      assigned: this.formBuilder.control(false)
    });
  }

  ngOnInit(): void {
    this.inputData = this.data;
    
    console.warn(this.inputData.id);
    if (this.inputData.title === "Edit") {
      this.setFormData(this.inputData.transaction)
    }
  }

  setFormData(transaction: Transaction) {
    this.editData = transaction;
    console.warn('set form data is called');
    console.warn(transaction.id);
    console.warn(transaction.type);
    //set transaction type
    this.selectedType = this.editData.type;
    this.transactionForm.patchValue({
      //ticker: this.editData.ticker, 
      openSide: this.editData.openSide,
      closeSide: this.editData.closeSide,
      quantity: this.editData.quantity,
      type: this.editData.type,
      strike: this.editData.strike,
      expiration: this.editData.expiration,
      premium: this.editData.premium,
      openAmount: this.editData.openAmount,
      closeAmount: this.editData.closeAmount,
      openDate: this.editData.openDate,
      closeDate: this.editData.closeDate,
      year: this.editData.year,
      group: this.editData.group,
      assigned: this.editData.assigned
    });

    // get open stock trades if it is stock
    if (this.editData.type === 'stock' && this.editData.openSide === 'sell') {
      this.dataService.getOpenStockTransactions(this.editData.ticker, 'buy').subscribe((res) => {
        const openDateCloseTrade = this.editData.openDate;
        const filteredTransactions = res.filter(transaction => transaction.closeDate === null && transaction.openDate <= openDateCloseTrade);
        this.stockOpenTrades = filteredTransactions;

        this.tableDataSource = this.stockOpenTrades;
      });
    }
  }

  onCheckboxClick(event: any, id: number) {
    const isChecked = event.checked;
    // Use isChecked to determine checkbox state for element with id
    console.log(`Checkbox with id ${id} is ${isChecked ? 'checked' : 'unchecked'}`);
  }

  saveTransaction() {
    this.ref.close(this.transactionForm.value);
  }

  closeForm() {
    this.ref.close(null);
  }

  //Sell Open 1 SBUX Jul 19 '24 $75 Put Limit Day
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Only highligh dates inside the month view.
    if (view === 'month') {
      const date = cellDate.getDate();

      // Highlight the 1st and 20th day of each month.
      return date === 1 || date === 20 ? 'example-custom-date-class' : '';
    }

    return '';
  };

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
