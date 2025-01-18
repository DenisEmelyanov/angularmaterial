import { Injectable } from "@angular/core";
import { Transaction } from "../model/transaction";
import { TickerData } from "../model/ticker-data";
import { DataService } from "./data.service";

@Injectable({
    providedIn: 'root'
})

export class CalculationService {

    constructor() {
    }

    public calcTotalNetPremium(transactions: Transaction[]) {
        const putNetPremium = transactions.filter(t => t.type === 'put').reduce((sum, current) => sum + current.premium, 0);
        const callNetPremium = transactions.filter(t => t.type === 'call').reduce((sum, current) => sum + current.premium, 0);
        const totalDividend = transactions.filter(t => t.type === 'dividend').reduce((sum, current) => sum + current.premium, 0);

        const sharesClosedTransactionsPremium = transactions.filter(t => t.type === 'stock' && t.closeDate !== null).reduce((sum, current) => sum + current.premium, 0);

        const totalNetPremium = putNetPremium + callNetPremium + totalDividend + sharesClosedTransactionsPremium;

        return {
            putNetPremium: putNetPremium,
            callNetPremium: callNetPremium,
            totalNetPremium: totalNetPremium,
            sharesTotalNetPremium: sharesClosedTransactionsPremium,
            pricePerShare: 0,
            risk: 0,
            breakEven: 0,
            openDate: '',
            closeDate: '',
            days: 0,
            annualizedReturn: 0,
            warningFlag: undefined
        }
    }

    public calcSummary(transactions: Transaction[], year: number) {//, stockTransactions: Transaction[]
        //get only open buy stock transactions from prevous years
        //stockTransactions = stockTransactions.filter(t => t.closeDate === null && t.openSide === 'buy' && t.year! < year);
        //transactions = transactions.concat(stockTransactions);

        const putNetPremium = transactions.filter(t => t.type === 'put').reduce((sum, current) => sum + current.premium, 0);
        const callNetPremium = transactions.filter(t => t.type === 'call').reduce((sum, current) => sum + current.premium, 0);
        const totalDividend = transactions.filter(t => t.type === 'dividend').reduce((sum, current) => sum + current.premium, 0);

        const boughtSharesQty = transactions.filter(t => t.type === 'stock' && t.openSide === 'buy').reduce((sum, current) => sum + current.quantity!, 0);
        const soldSharesQty = transactions.filter(t => t.type === 'stock' && t.openSide === 'sell').reduce((sum, current) => sum + current.quantity!, 0);
        let sharesQty = boughtSharesQty - soldSharesQty;

        const sharesOpenTrasactionsPremium = transactions.filter(t => t.type === 'stock' && t.openSide == 'buy' && t.closeDate === null).reduce((sum, current) => sum + current.premium, 0);
        const sharesClosedTransactionsPremium = transactions.filter(t => t.type === 'stock' && t.closeDate !== null).reduce((sum, current) => sum + current.premium, 0);

        const totalNetPremium = putNetPremium + callNetPremium + totalDividend + sharesClosedTransactionsPremium;

        if (sharesQty < 0) {
            sharesQty = 0;
        }

        var pricePerShare = 0;
        if (sharesQty > 0) {
            pricePerShare = sharesOpenTrasactionsPremium / sharesQty;
        }

        if (pricePerShare < 0) {
            pricePerShare = pricePerShare * -1;
        }

        const optionsOnly = transactions.filter(t => t.type === 'put' || t.type === 'call');
        // get open contracts, if no, then get transactions with latest close date
        const openContracts = optionsOnly.filter(t => t.closeDate === undefined || t.closeDate === null);
        // use put only to calculate risk
        var riskContracts = openContracts.filter(t => t.type === 'put');
        // for closed positions: no open contracts and open shares
        if (openContracts.length === 0 && sharesQty === 0) {
            var riskContracts = this.getTransactionsWithLatestCloseDate(optionsOnly);
        }
        //console.warn(year + ' risk contracts: ' + riskContracts.length);
        //console.warn(year + ' ' + riskContracts);

        var risk = 0;
        if (riskContracts.length === 0 && sharesQty > 0) {
            // no open contracts, only shares
            risk = pricePerShare * sharesQty;
        }
        else {
            risk = riskContracts.reduce((sum, current) => sum + current.strike! * current.quantity! * 100, 0) + pricePerShare * sharesQty;
        }

        //console.warn('open shares qty: ' + sharesQty);

        var riskQty = 0;
        if (openContracts.length === 0 && sharesQty > 0) {
            riskQty = sharesQty;
        }
        else {
            riskQty = riskContracts.reduce((sum, current) => sum + current.quantity! * 100, 0) + sharesQty;
        }
        //console.warn(year + ' risk: ' + risk);
        //console.warn(year + ' risk qty: ' + riskQty);

        var breakEven = 0;
        if (openContracts.length === 0 && sharesQty > 0) {
            breakEven = pricePerShare - totalNetPremium / sharesQty;
        }
        else {
            breakEven = (risk - totalNetPremium) / riskQty;
        }


        const openDate = this.earliestOpenDate(transactions)?.openDate!;

        var expirationDate = this.latestExpirationDate(openContracts)?.expiration!;
        if (openContracts.length === 0) {
            if (sharesQty > 0) {
                expirationDate = new Date().toISOString().split('T')[0];
            }
            else {
                expirationDate = this.latestCloseDate(transactions)?.closeDate!
            }
        }
        //console.warn('open date: ' + openDate);
        //console.warn('close date: ' + expirationDate);
        const days = this.daysDifference(openDate, expirationDate);

        const period = days === 0 ? 1 : days;
        const annualizedReturn = (totalNetPremium / risk) * (365 / period);

        //set warning flag if there are some not closed stocks and stockQty = 0, or < 0, or sell does not have close date
        const warningFlag =
            sharesQty < 0 ||
            (sharesQty === 0 && transactions.some(t => t.type === 'stock' && !t.closeDate)) ||
            (sharesQty > 0 && transactions.some(t => t.type === 'stock' && !t.closeDate && t.openSide === 'sell'));

        return {
            putNetPremium: putNetPremium,
            callNetPremium: callNetPremium,
            totalNetPremium: totalNetPremium,
            sharesQty: sharesQty,
            sharesTotalNetPremium: sharesClosedTransactionsPremium,
            pricePerShare: pricePerShare,
            risk: risk,
            breakEven: breakEven,
            openDate: openDate,
            closeDate: expirationDate,
            days: days,
            annualizedReturn: annualizedReturn,
            warningFlag: warningFlag
        }
    }

    public calculateMedian(numbers: number[]): number {
        const sortedNumbers = numbers.sort((a, b) => a - b);
        const middleIndex = Math.floor(sortedNumbers.length / 2);

        if (sortedNumbers.length % 2 === 0) {
            // Even number of elements, average the middle two
            return (sortedNumbers[middleIndex - 1] + sortedNumbers[middleIndex]) / 2;
        } else {
            // Odd number of elements, return the middle element
            return sortedNumbers[middleIndex];
        }
    }

    public earliestOpenDate(transactions: Transaction[]) {
        return transactions.reduce((earliest, current) => {
            return earliest ? (new Date(earliest.openDate).getTime() < new Date(current.openDate).getTime() ? earliest : current) : current;
        }, null as Transaction | null);
    }

    private getTransactionsWithLatestCloseDate(transactions: Transaction[]): Transaction[] {
        // Find the maximum close date timestamp
        const latestTimestamp = Math.max(...transactions.map(t => new Date(t.closeDate!).getTime()));

        // Filter transactions with the latest close date
        return transactions.filter(t => new Date(t.closeDate!).getTime() === latestTimestamp);
    }

    public latestCloseDate(transactions: Transaction[]) {
        return transactions.reduce((latest, current) => {
            return latest ? (new Date(latest.closeDate!).getTime() > new Date(current.closeDate!).getTime() ? latest : current) : current;
        }, null as Transaction | null);
    }

    public latestExpirationDate(transactions: Transaction[]) {
        return transactions.reduce((earliest, current) => {
            return earliest ? (new Date(earliest.expiration!).getTime() > new Date(current.expiration!).getTime() ? earliest : current) : current;
        }, null as Transaction | null);
    }

    public daysDifference(date1: string, date2: string): number {
        // Create Date objects from the strings
        const dateObject1 = new Date(date1);
        const dateObject2 = new Date(date2);

        // Handle invalid dates gracefully (optional)
        if (isNaN(dateObject1.getTime()) || isNaN(dateObject2.getTime())) {
            return -1; // Or throw an error if you prefer
        }

        // Get the difference in milliseconds
        const timeDiff = Math.abs(dateObject1.getTime() - dateObject2.getTime());

        // Convert milliseconds to days and round down to the nearest whole day
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        return daysDiff;
    }

    calcStockPrice(premium: number, amount: number, qty: number) {
        if (amount) {
            return Math.abs(amount / qty);
        }
        else {
            return Math.abs(premium / qty);
        }
    }
}