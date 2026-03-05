//  public class CreateCOA
//  {
//      [Required(ErrorMessage = "Name is required")]
//      public string? Name { get; set; }= string.Empty;
//      public int? ParentId { get; set; }
//      [Required(ErrorMessage = "Account kind is required")]
//      public AccountKind? Kind { get; set; }

//      [Required(ErrorMessage = "Account category is required")]
//      public AccountType? Category { get; set; }
//      public decimal? OpeningBalance { get; set; }
//  }
//  public enum AccountType
//     {
//         Asset = 1,
//         Liability = 2,
//         Equity = 3,
//         Revenue = 4,
//         Expense = 5
//     }

//     public enum BalanceType
//     {
//         Debit = 1,  // Increases with Debit (Assets, Expenses)
//         Credit = 2  // Increases with Credit (Liabilities, Equity, Revenue)
//     }

//     public enum AccountKind
//     {
//         Group = 1,  // A folder for other accounts (Summary only)
//         Ledger = 2  // A postable account for transactions (The "Leaf")
//     }