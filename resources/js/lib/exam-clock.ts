export function parseExamTimestamp(value: string): number {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
return Date.parse(value);
}

    const match = value.match(
        /^(\d{2})[-/](\d{2})[-/](\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    );

    if (match) {
return new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1]),
            Number(match[4] || 0),
            Number(match[5] || 0),
            Number(match[6] || 0),
        ).getTime();
}

    return Date.parse(value);
}
export function remainingExamSeconds(
    startedAt: number,
    durationSeconds: number,
    offset: number,
    now = Date.now(),
): number {
    return Math.max(
        0,
        Math.ceil((startedAt + durationSeconds * 1000 - now - offset) / 1000),
    );
}
export function observeExamClock(
    update: () => void,
    page: Document = document,
    browser: Window = window,
): () => void {
    const resume = () => {
        if (page.visibilityState === 'visible') {
update();
}
    };
    update();
    const interval = browser.setInterval(update, 1000);
    page.addEventListener('visibilitychange', resume);
    browser.addEventListener('focus', resume);
    browser.addEventListener('pageshow', resume);

    return () => {
        browser.clearInterval(interval);
        page.removeEventListener('visibilitychange', resume);
        browser.removeEventListener('focus', resume);
        browser.removeEventListener('pageshow', resume);
    };
}
