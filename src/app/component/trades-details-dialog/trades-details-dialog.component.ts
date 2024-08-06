import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-trades-details-dialog',
  templateUrl: './trades-details-dialog.component.html',
  styleUrls: ['./trades-details-dialog.component.css']
})
export class TradesDetailsDialogComponent {

  dataSource: any;

  displayedColumns: string[] = ["transaction", "chips", "openDate", "closeDate", "premium"];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<PopupComponent>) {
    
  }
  closeDialog() {
    this.ref.close();
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }
}