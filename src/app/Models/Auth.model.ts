export interface Login {
    userName: string,
    password: string
}
export interface LoginResponse {
    accessToken: string
}
export interface Register {
    email: string,
    userName: string,
    password: string,
    confirmPassword: string,
    phoneNo: string,
    name: string
    fiscalStartMonth: number,
    currencyCode: string | null;
}
export interface CurrencyDto {
    code: string,
    name: string,
    symbol: string
}
export interface Token {
    token: string
}
export enum Month {
    January = 1,
    February = 2,
    March = 3,
    April = 4,
    May = 5,
    June = 6,
    July = 7,
    August = 8,
    September = 9,
    October = 10,
    November = 11,
    December = 12
}