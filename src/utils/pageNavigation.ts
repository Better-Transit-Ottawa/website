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

export function debounce<A>(c: (...args: A[]) => void, delay = 50): (...args: A[]) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args) => {
        clearTimeout(timeout!);
        timeout = setTimeout(() => {
            c(...args);
        }, delay);
    }
}