export interface CreateFiscalYear{
    year: number | null,
    yearDate: Date | null,
    remarks: string
}

export interface FiscalYearList{
    name: string
    startDate : Date
    endDate: Date
    status: FiscalYearStatus
    remarks: string
}

export enum FiscalYearStatus
{
    Active = 1,
    Closed = 2,
    NeedsReclosure = 3
}