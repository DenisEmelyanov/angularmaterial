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
  premiumFieldDisabled: boolean = false;

  stockOpenTrades: Transaction[] = [];
  tableDataSource: any;
  displayedColumns: string[] = ["select", "transaction", "openDate", "closeDate", "premium"];

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

    // TODO disable premium if openAmount and closeAmount are entered
    this.premiumFieldDisabled = this.editData.openAmount !== null && this.editData.closeAmount !== null;

    // set open / close amount for open stock trades
    if (this.editData.type === 'stock' && (this.editData.closeDate === null || this.editData.closeDate === undefined)) {
      if (this.editData.openSide === 'sell') {
        this.editData.closeAmount = this.editData.premium;
      }
      else if (this.editData.openSide === 'buy') {
        this.editData.openAmount = this.editData.premium;
      }
    }
    console.log(this.editData);

    this.transactionForm.patchValue({
      //ticker: this.editData.ticker, 
      openSide: this.editData.openSide,
      closeSide: this.editData.closeSide,
      quantity: this.editData.quantity,
      type: this.editData.type,
      strike: this.editData.strike,
      expiration: this.editData.expiration,
      premium: this.editData.premium,
      // {
      //   value: this.editData.premium,
      //   disabled: this.premiumFieldDisabled
      // },
      openAmount: this.editData.openAmount,
      closeAmount: this.editData.closeAmount,
      openDate: this.editData.openDate,
      closeDate: this.editData.closeDate,
      year: this.editData.year,
      group: this.editData.group,
      assigned: this.editData.assigned
    });

    // get open stock trades if it is stock
    if (this.editData.type === 'stock' && this.editData.openSide === 'sell' && this.editData.closeDate === null) {
      this.dataService.getOpenStockTransactions(this.editData.ticker, 'buy').subscribe((res) => {
        const openDateCloseTrade = this.editData.openDate;
        const filteredTransactions = res.filter(transaction => transaction.closeDate === null && transaction.openDate <= openDateCloseTrade);
        this.stockOpenTrades = filteredTransactions;

        this.tableDataSource = this.stockOpenTrades;
      });
    }
  }

  premiumUpdate(event: number) {
    console.log('premium update: ' + event);
    const currentValues = this.transactionForm.value;

    // update only for call, put and stock types
    if (currentValues.type === 'call' || currentValues.type === 'put' || currentValues.type === 'stock') {
      console.log('current premium: ' + currentValues.premium);
      console.log('current openAmount: ' + currentValues.openAmount);
      console.log('current closeAmount: ' + currentValues.closeAmount);

      // disable premium field if open and current amount 
      this.premiumFieldDisabled = currentValues.openAmount !== null && currentValues.closeAmount !== null;
      // this.transactionForm.patchValue ({
      //   premium:
      //   {
      //     value: currentValues.premium,
      //     disabled: this.premiumFieldDisabled
      //   },
      // });
      if (currentValues.openAmount !== null && currentValues.closeAmount !== null) {
        const newPremium = currentValues.openAmount + currentValues.closeAmount;
        this.transactionForm.patchValue({
          premium: newPremium
        });
      }
    }
  }

  onCheckboxClick(event: any, id: number) {
    const isChecked = event.checked;
    const currentValues = this.transactionForm.value;

    const transaction = this.stockOpenTrades.find(t => t.id === id);
    if (transaction) {
      if (isChecked) {
        console.log(`Found transaction with id ${transaction.id}: ${transaction.premium}`);

        this.transactionForm.patchValue({
          openAmount: transaction.premium,
          premium: transaction.premium + currentValues.closeAmount,
          closeDate: currentValues.openDate
        });
        // set closeDate for used buy trade
        transaction.closeDate = currentValues.openDate;
      }
      else {

        this.transactionForm.patchValue({
          openAmount: null,
          premium: currentValues.closeAmount,
          closeDate: null
        });

        transaction.closeDate = null;
      }
    }
  }

  saveTransaction() {
    var updatedTrades: Transaction[] = [this.transactionForm.value];
    let transaction = this.stockOpenTrades.find(t => t.closeDate !== null);

    if (transaction) {
      //TODO updatedAt and createdAt appears if push transaction from grid
      // reset premium
      transaction.openAmount = transaction.premium;
      transaction.premium = 0;

      updatedTrades.push(transaction);
      console.log(updatedTrades);
    }
    this.ref.close(updatedTrades);
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
