export interface NavChild {
    label: string;
    route: string;
    permissionKey?: string; // wire this up later when you add role/rights filtering
}

export interface NavGroup {
    key: string;
    icon: string;
    label: string;
    directRoute?: string;   // use for plain links like Dashboard/Reports
    children?: NavChild[];  // use for dropdown groups like COA/Voucher/Settings
    permissionKey?: string;
}

export interface ModuleLayoutConfig {
    moduleLabel: string;
    menuGroups: NavGroup[];
}