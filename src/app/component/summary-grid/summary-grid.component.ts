import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TickerData } from 'src/app/model/ticker-data';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';
import { FileSelectDialogComponent } from '../file-select-dialog/file-select-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-summary-grid',
  templateUrl: './summary-grid.component.html',
  styleUrls: ['./summary-grid.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryGridComponent {

  @Output() 
  detailsClickEvent = new EventEmitter<TickerData>();

  dataSource: any;
  calendarYear: any;
  group: any;

  displayedColumns: string[] = ["ticker", "description", "chips", "totalNetPremium", "openDate", "closeDate", "risk", "breakEven", "annualizedReturn", "action"];//"closeDate", "total net premium", "annualized return", 
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService, private importDialog: MatDialog) {
  }

  ngOnInit() {
    this.dataService.currentData.subscribe(() => {
      const data = this.dataService.tickersData;
      var tableDataArr: any[] = [];
      Object.keys(data).forEach(ticker => {
        tableDataArr.push({
          ticker: ticker,
          description: data[ticker].description,
          risk: data[ticker].summary!.risk,
          sharesQty: data[ticker].summary!.sharesQty,
          totalNetPremium: data[ticker].summary!.totalNetPremium,
          openDate: data[ticker].summary!.openDate,
          closeDate: data[ticker].summary!.closeDate,
          breakEven: data[ticker].summary!.breakEven,
          annualizedReturn: data[ticker].summary!.annualizedReturn
        });
      })
      this.dataSource = tableDataArr;
    });
  }

  onDetails(data: any) {
    this.detailsClickEvent.emit(data);
  }

  importTransactions() {
    this.openImportDialog();
    //this.downloadService.downloadJson(null, '');
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
          //this.refreshTable();
        };

        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          // Handle errors (e.g., file type not supported)
        };
      }
    });
  }

  public getColor(value: number): string {
    if (value === 0)
      return "black";
    else
      return value > 0 ? "green" : "red";
  }

  isFutureDate(dateStr: string): boolean {
    // Create Date objects
    const today = new Date();
    const checkDate = new Date(dateStr);
  
    // Handle invalid dates gracefully (optional)
    if (isNaN(checkDate.getTime())) {
      return false; // Or throw an error if you prefer
    }
  
    // Compare with today's date
    return checkDate.getTime() > today.getTime();
  }
  
}
