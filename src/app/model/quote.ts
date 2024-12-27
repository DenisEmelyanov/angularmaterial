export interface Quote {
    ticker: string;
    date: string;
    open?: number;
    close?: number;
    high?: number;
    low?: number;
    volume?: number;
}