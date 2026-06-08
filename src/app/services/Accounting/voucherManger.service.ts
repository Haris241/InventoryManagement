import { Injectable } from "@angular/core";
import { AccountingLine, CreateJournalEntryLine, VoucherType } from "../../Models/Accouting/VoucherManager.model";

@Injectable({
    providedIn: 'root'
})
export class voucherMangerService {
    validate<T extends AccountingLine>(lines: T[]): string[] {
        const errors: string[] = [];

        if (!lines || lines.length < 2) {
            return ['At least 2 lines are required.'];
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
    generateSmartLines(lines: CreateJournalEntryLine[], voucherType: VoucherType): Partial<CreateJournalEntryLine> {

        if (!lines.length) return {};

        const firstLine = lines[0];

        // ✅ Balance in BASE currency (the only meaningful balance in multi-currency)
        const totalBaseDebit = lines.reduce((sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)), 0);
        const totalBaseCredit = lines.reduce((sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)), 0);
        const baseBalance = totalBaseDebit - totalBaseCredit;

        const copiedExchangeRate = firstLine.exchangeRate || 1;

        let newDebit = 0;
        let newCredit = 0;

        if (baseBalance > 0) {
            // Base has more debit → need credit to balance
            newCredit = baseBalance / copiedExchangeRate; // convert back to transaction amount
        } else if (baseBalance < 0) {
            newDebit = Math.abs(baseBalance) / copiedExchangeRate;
        } else {
            // Already base-balanced — flip line[0]'s side safely
            const firstDebit = firstLine.debit || 0;
            const firstCredit = firstLine.credit || 0;

            if (firstDebit > 0) {
                newCredit = firstDebit;
            } else {
                newDebit = firstCredit;
            }
        }



        return {
            description: firstLine.description || '',
            currencyCode: firstLine.currencyCode ?? null,
            exchangeRate: firstLine.exchangeRate ?? 1,
            referenceNo: firstLine.referenceNo || '',
            debit: Number(newDebit.toFixed(2)) || 0,
            credit: Number(newCredit.toFixed(2)) || 0,
        };
    }
}