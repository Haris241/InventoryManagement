export function enumToOptions<T extends Record<string, string | number>>(enumObj: T, humanize = false): { name: string; value: number }[] {
    return Object.keys(enumObj)
        .filter(key => isNaN(Number(key)))
        .map(key => ({
            name: humanize ? key.replace(/([A-Z])/g, ' $1').trim() : key,
            value: enumObj[key] as number
        }));
}
