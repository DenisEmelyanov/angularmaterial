import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputComponent } from './input/input.component';
import { MaterialModule } from './material-module';
import { AutocompleteComponent } from './component/autocomplete/autocomplete.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MenubarComponent } from './component/menubar/menubar.component';
import { HomeComponent } from './component/home/home.component';
import { CardComponent } from './component/card/card.component';
import { SliderComponent } from './component/slider/slider.component';
import { TableComponent } from './component/table/table.component';
import { HttpClientModule } from '@angular/common/http';
import { FormdesignComponent } from './component/formdesign/formdesign.component';
import { PopupComponent } from './component/popup/popup.component';
import { AssociateComponent } from './component/associate/associate.component';
import { UserdetailComponent } from './component/userdetail/userdetail.component';
import { TransactionsGridComponent } from './component/transactions-grid/transactions-grid.component';
import { TransactionFormComponent } from './component/transaction-form/transaction-form.component';
import { CustomSidePipe } from 'src/app/pipes/side-pipe'
import { CustomTypePipe } from 'src/app/pipes/type-pipe';
import { TabContentComponent } from './component/tab-content/tab-content.component'
import { MatGridListModule } from '@angular/material/grid-list';
import { CustomCurrencyPipe } from './pipes/customCurrency-pipe';
import { TradesSummaryComponent } from './component/trades-summary/trades-summary.component';
import { FileSelectDialogComponent } from './component/file-select-dialog/file-select-dialog.component';
import { SummaryGridComponent } from './component/summary-grid/summary-grid.component';
import { TradesStatisticGridComponent } from './component/trades-statistic-grid/trades-statistic-grid.component';
import { TradesDetailsDialogComponent } from './component/trades-details-dialog/trades-details-dialog.component';
import { Chart } from 'chart.js/auto';

@NgModule({
  declarations: [
    AppComponent,
    InputComponent,
    AutocompleteComponent,
    MenubarComponent,
    HomeComponent,
    CardComponent,
    SliderComponent,
    TableComponent,
    FormdesignComponent,
    PopupComponent,
    AssociateComponent,
    UserdetailComponent,
    TransactionsGridComponent,
    TransactionFormComponent,
    CustomSidePipe,
    CustomTypePipe,
    CustomCurrencyPipe,
    TabContentComponent,
    TradesSummaryComponent,
    FileSelectDialogComponent,
    SummaryGridComponent,
    TradesStatisticGridComponent,
    TradesDetailsDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatGridListModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
