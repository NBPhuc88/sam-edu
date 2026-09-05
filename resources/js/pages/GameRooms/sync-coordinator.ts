/** Coalesce overlapping refreshes while keeping callers waiting for the latest response. */
export function createSyncCoordinator(
    run: () => Promise<void>,
): () => Promise<void> {
    let active: Promise<void> | null = null;
    let pending = false;

    return () => {
        pending = true;

        if (active) {
            return active;
        }

        active = Promise.resolve().then(async () => {
            try {
                do {
                    pending = false;
                    await run();
                } while (pending);
            } finally {
                active = null;
            }
        });

        return active;
    };
}
