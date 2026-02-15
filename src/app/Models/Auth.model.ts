export interface Login{
    userName: string,
    password: string
}
export interface LoginResponse{
    accessToken: string
}
export interface Register{
    email: string,
    userName: string,
    password: string,
    confirmPassword: string,
    phoneNo: string,
    name: string
    FiscalStartMonth: Date
}
export interface Token{
    token: string
}