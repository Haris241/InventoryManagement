export interface ClientSettingGetDTO {
    id: string;
    name: string;
    imagePath: string;
}

export interface ClientSettingUpdateDTO {
    id: string;
    name: string;
    imageFile?: File;
    imagePath?: string;
}
export interface InventoryWorkflowDto {
    id: string;
    enableDemand: boolean;
    enableGateEntry: boolean;
    enableGRN: boolean;
    enableOutwardGatePass: boolean;
    enableInternalMovement: boolean;
    requirePOForGRN: boolean;
    postingPoint: VoucherPostingPoint;

}
export enum VoucherPostingPoint {
    Purchase,
    GRN,
    ManualInvoice
}
export interface AccountMappingDto {
    id?: string;
    key: AccountMappingKey;
    keyName?: string;
    chartOfAccountId: number;
    chartOfAccountName?: string;
}
export interface AccountMappingBulkSaveDTO {
    mappings: AccountMappingDto[];
}
export enum AccountMappingKey {
    // Asset
    InventoryDefault = 1,
    // Liability
    GRNI = 2,
    // Revenue
    Sales = 3,
    // Expense
    COGS = 4,
    //Equity
    OpeningStockOffset = 5,
    // Asset
    InputTaxAccount = 6,
    // Liability
    OutputTaxAccount = 7
}