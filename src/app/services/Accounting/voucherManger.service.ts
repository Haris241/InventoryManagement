import { Injectable } from "@angular/core";
import { AccountingLine } from "../../Models/Accouting/VoucherManager.model";

@Injectable({
    providedIn: 'root'
})
export class voucherMangerService {
    validate<T extends AccountingLine>(lines: T[]): string[] {
        const errors: string[] = [];

        if (!lines || lines.length < 2) {
            return ['At least 2 lines are required.'];
        }

        const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
        const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            errors.push('Entry is not balanced.');
        }

        if (lines.some(l => (l.debit || 0) < 0 || (l.credit || 0) < 0)) {
            errors.push('Negative values are not allowed.');
        }
        if (lines.some(l => (l.exchangeRate || 0) <= 0)) {
            errors.push('Exchange rate must be greater than 0.');
        }

        if (lines.some(l => (l.debit || 0) > 0 && (l.credit || 0) > 0)) {
            errors.push('One line cannot have both debit and credit.');
        }

        if (lines.some(l => (l.debit || 0) === 0 && (l.credit || 0) === 0)) {
            errors.push('Each line must have a value.');
        }

        const baseDebit = lines.reduce(
            (s, l) => s + (l.debit || 0) * (l.exchangeRate || 1),
            0
        );

        const baseCredit = lines.reduce(
            (s, l) => s + (l.credit || 0) * (l.exchangeRate || 1),
            0
        );

        if (Math.abs(baseDebit - baseCredit) > 0.01) {
            errors.push('Base currency is not balanced.');
        }

        return errors;
    }
}