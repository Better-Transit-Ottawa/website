export function getPageUrl(pathname: string, searchParams: URLSearchParams, newValues: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const key in newValues) {
        const value = newValues[key];
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
    }

    return `${pathname}?${params.toString()}`
}