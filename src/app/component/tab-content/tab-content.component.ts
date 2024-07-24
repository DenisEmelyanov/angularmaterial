import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TickerData } from 'src/app/model/ticker-data';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';
import { SummaryGridComponent } from '../summary-grid/summary-grid.component';

@Component({
  selector: 'app-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css']
})
//https://stackoverflow.com/questions/37587732/how-to-call-another-components-function-in-angular2
export class TabContentComponent {
  
  openTabs: any = [];
  selectedTabIndex: any = 0;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {

  }

  onAddingTab(tickerData: any) {
    this.addTab(tickerData, true);
  }

  addTab(tickerData: TickerData, selectAfterAdding: boolean) {
    //TODO:check if tab is already added
    var index = this.findTabIndex(this.openTabs, "ticker", tickerData.ticker);
    console.warn('tab index: ' + index);
    if (index === -1) {
      this.openTabs.push(tickerData);
      if (selectAfterAdding) {
        this.selectedTabIndex = this.openTabs.length;
      }
    }
    else {
      index = index + 1;
      console.warn(tickerData.ticker + ' tab is already opened. Index: ' + index);
      console.warn(this.openTabs);
      console.warn(this.selectedTabIndex);
      this.selectedTabIndex = index;
    }
  }

  removeTab(tickerData: TickerData) {
    const index = this.findTabIndex(this.openTabs, "ticker", tickerData.ticker);
    this.openTabs.splice(index, 1);
    // select summary tab
    this.selectedTabIndex = 0;
  }

  findTabIndex<T>(array: T[], property: keyof T, value: T[keyof T]): number {
    return array.findIndex(item => item[property] === value);
  }
}
