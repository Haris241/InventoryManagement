export interface CreateFiscalYear {
    year: number | null,
    yearDate: Date | null,
    remarks: string
}

export interface FiscalYearList {
    id: string,
    name: string,
    startDate: Date,
    endDate: Date,
    status: FiscalYearStatus,
    remarks: string,
    isDefault: boolean
}

export interface SwitchYearRequest {
    id: string
}

export enum FiscalYearStatus {
    Open = 1,
    Closed = 2,
    NeedReClosure = 3
}

