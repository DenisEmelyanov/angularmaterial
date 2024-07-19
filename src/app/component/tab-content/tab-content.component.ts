import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css']
})

export class TabContentComponent {
  @Output()
  dataUpdated = new EventEmitter<Transaction[]>();

  dataTicker: string = 'ASO';
  transactionsList!: Transaction[];

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
  }

  refreshData() {
    console.warn('table data is updated')
    this.dataUpdated.emit(this.transactionsList);
  }
}
