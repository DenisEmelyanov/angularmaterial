import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Transaction } from 'src/app/model/transaction';

@Component({
  selector: 'app-trades-details-dialog',
  templateUrl: './trades-details-dialog.component.html',
  styleUrls: ['./trades-details-dialog.component.css']
})
export class TradesDetailsDialogComponent implements OnInit {

  dataSource: any;
  title: any;

  displayedColumns: string[] = [];
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<PopupComponent>) {
    this.displayedColumns = data.columns;
  }

  ngOnInit(): void {
    this.title = this.data.title.toUpperCase();

    this.dataSource = this.sortByOpenDate(this.data.transactions);
  }

  sortByOpenDate(data: Transaction[]): Transaction[] {
    return data.sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());
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
