import type { Answer, GameQuestion } from './types';

export function initialGameAnswer(question: GameQuestion): Answer {
    if (question.question_type !== 9) {
        return null;
    }

    const options = question.options as
        { items?: unknown[]; options?: unknown[] } | unknown[] | null;
    const items = Array.isArray(options)
        ? options
        : (options?.items ?? options?.options ?? []);

    return items.map((item, index) => {
        if (typeof item === 'string') {
            return String(index + 1);
        }

        const option = item as { id?: string; key?: string; value?: string };

        return String(option.id ?? option.key ?? option.value ?? index + 1);
    });
}
