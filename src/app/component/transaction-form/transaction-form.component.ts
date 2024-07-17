import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { TransactionService } from 'src/app/service/transactions.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TransactionFormComponent implements OnInit{
  inputData: any;
  editData: any;
  transactionForm : any;


  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<PopupComponent>, private formBuilder: FormBuilder,
    private service: TransactionService) {

      this.transactionForm = this.formBuilder.group({
        //id: this.formBuilder.control(this.data.id),
        ticker: this.formBuilder.control(this.data.ticker),
        side: this.formBuilder.control(''),
        quantity: this.formBuilder.control(1),
        type: this.formBuilder.control(''),
        strike: this.formBuilder.control(''),
        expiration: this.formBuilder.control(''),
        premium: this.formBuilder.control(''),
        openDate: this.formBuilder.control(new Date()),
        closeDate: this.formBuilder.control('')
      });

  }

  ngOnInit(): void {
    this.inputData = this.data;
    console.warn(this.inputData.id);
    if (this.inputData.title === "Edit"){
      this.setFormData(this.inputData.id)
    }
  }

  setFormData(id: any) {
      this.editData = this.service.getTransactionById(id);
      console.warn('set form data is called');
      this.transactionForm.patchValue({
        //ticker: this.editData.ticker, 
        side: this.editData.side, 
        quantity: this.editData.quantity,
        type: this.editData.type, 
        strike: this.editData.strike,
        expiration: this.editData.expiration,
        premium: this.editData.premium,
        openDate: this.editData.openDate,
        closeDate: this.editData.closeDate
      })
  }

  saveTransaction() {
    this.service.updateTransaction(this.transactionForm.value)
    this.closeForm();
  }

  closeForm() {
    this.ref.close(this.transactionForm.value);
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
}