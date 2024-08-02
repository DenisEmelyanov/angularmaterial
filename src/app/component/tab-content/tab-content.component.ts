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

  summaryTab: string = 'SUMMARY';
  statisticTab: string = 'DATA ANALYTICS';
  openTabs: any = [this.summaryTab, this.statisticTab];
  selectedTabIndex: number = 0;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {

  }

  onAddingTab(tickerData: TickerData) {
    this.addTab(tickerData, true);
  }

  addTab(tickerData: TickerData, selectAfterAdding: boolean) {
    //TODO:check if tab is already added
    console.warn('tab tickerData: ' + tickerData.ticker + ' ' + tickerData.year);
    const index = this.findTabIndex(this.openTabs, "ticker", "year", tickerData.ticker, tickerData.year);
    console.warn('tab index: ' + index);
    if (index === -1) {
      this.openTabs.push(tickerData);
      if (selectAfterAdding) {
        this.selectedTabIndex = this.openTabs.length;
      }
    }
    else {
      //index = index + 1;
      console.warn(tickerData.ticker + ' tab is already opened. Index: ' + index);
      console.warn(this.openTabs);
      console.warn(this.selectedTabIndex);
      this.selectedTabIndex = index;
    }
  }

  removeTab(tickerData: TickerData) {
    const index = this.findTabIndex(this.openTabs, "ticker", "year", tickerData.ticker, tickerData.year);
    this.openTabs.splice(index, 1);
    // select summary tab
    this.selectedTabIndex = 0;
  }

  findTabIndex<T>(array: T[], property1: keyof T, property2: keyof T, value1: T[keyof T], value2: T[keyof T]): number {
    return array.findIndex(item => item[property1] === value1 && item[property2] === value2);
  }
}
