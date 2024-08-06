import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';

@Component({
  selector: 'app-trades-details-dialog',
  templateUrl: './trades-details-dialog.component.html',
  styleUrls: ['./trades-details-dialog.component.css']
})
export class TradesDetailsDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<PopupComponent>) {
    
  }
  closeDialog() {
    this.ref.close();
  }
}
