export function asArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && Array.isArray((value as any).$values)) return (value as any).$values as T[];
    return [];
}

export function asNumberArray(value: any): number[] {
    const numbers = asArray<any>(value)
        .map((entry) => (typeof entry === "string" ? Number(entry) : entry))
        .filter((entry): entry is number => Number.isFinite(entry));

    return numbers.length ? [...numbers].sort((a, b) => a - b) : [];
}