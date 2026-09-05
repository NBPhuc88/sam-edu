import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { index, store } from '@/routes/game-rooms';
export default function Create({
    exams,
    scoringRules,
}: {
    exams: {
        id: number;
        name: string;
        questions_count: number;
        disallowed_count: number;
    }[];
    scoringRules: { seconds: number; points: number }[];
}) {
    const form = useForm({
        exam_id: 0,
        question_time_limit: 20,
        scoring_rules: scoringRules,
    });

    const handleAddRule = () => {
        const rules = form.data.scoring_rules;
        if (rules.length === 0) {
            form.setData('scoring_rules', [
                { seconds: 5, points: 1000 },
                { seconds: form.data.question_time_limit || 20, points: 500 },
            ]);
            return;
        }

        const lastRule = rules[rules.length - 1];
        const nextSeconds =
            lastRule.seconds < 30
                ? Math.min(30, Number((lastRule.seconds + 2).toFixed(1)))
                : 30;
        const nextPoints = Math.max(0, lastRule.points - 100);

        form.setData('scoring_rules', [
            ...rules,
            { seconds: nextSeconds, points: nextPoints },
        ]);
    };

    const handleDeleteRule = (indexToDelete: number) => {
        if (form.data.scoring_rules.length <= 1) {
            return;
        }
        form.setData(
            'scoring_rules',
            form.data.scoring_rules.filter((_, i) => i !== indexToDelete),
        );
    };

    return (
        <AppLayout title="Tạo đấu trường">
            <form
                className="mx-auto max-w-2xl space-y-6 p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(store.url());
                }}
            >
                <Link href={index()} className="text-sm text-emerald-700 font-medium hover:underline">
                    ← Danh sách phòng
                </Link>
                <h1 className="text-3xl font-black">Thiết lập trận đấu</h1>
                <label className="block font-semibold">
                    Chọn đề thi
                    <select
                        required
                        className="mt-2 w-full rounded-xl border p-3"
                        value={form.data.exam_id}
                        onChange={(e) =>
                            form.setData('exam_id', Number(e.target.value))
                        }
                    >
                        <option value={0}>Chọn một đề thi</option>
                        {exams.map((exam) => (
                            <option
                                key={exam.id}
                                value={exam.id}
                                disabled={
                                    !!exam.disallowed_count ||
                                    !exam.questions_count
                                }
                            >
                                {exam.name} —{' '}
                                {exam.disallowed_count
                                    ? 'Có câu cần viết / ghi âm'
                                    : !exam.questions_count
                                      ? 'Chưa có câu hỏi'
                                      : '✓ Phù hợp tạo game (Không có câu cần viết)'}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block font-semibold">
                    Thời gian trả lời mỗi câu (5–30 giây)
                    <input
                        className="mt-2 w-full rounded-xl border p-3"
                        type="number"
                        min={5}
                        max={30}
                        required
                        value={form.data.question_time_limit}
                        onChange={(e) =>
                            form.setData(
                                'question_time_limit',
                                Number(e.target.value),
                            )
                        }
                    />
                </label>
                <p className="text-sm text-slate-500">
                    Thời gian chuyển câu cố định 5 giây. Chỉ học sinh được trả
                    lời và tính điểm.
                </p>
                <fieldset className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <legend className="font-bold text-gray-900">
                                Thang điểm tốc độ
                            </legend>
                            <p className="text-xs text-slate-500">
                                Mốc thời gian phải tăng dần, mốc cuối cùng phải bao phủ thời gian trả lời.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="success"
                            size="sm"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={handleAddRule}
                        >
                            Thêm mốc điểm
                        </Button>
                    </div>
                    <div className="space-y-3 pt-1">
                        {form.data.scoring_rules.map((rule, i) => (
                            <div key={i} className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-2xs">
                                <label className="flex-1">
                                    <span className="text-xs font-semibold text-slate-700">
                                        Mốc {i + 1}: Dưới (giây)
                                    </span>
                                    <input
                                        aria-label={`Mốc thời gian ${i + 1}`}
                                        type="number"
                                        min={0.1}
                                        max={30}
                                        step={0.1}
                                        required
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                        value={rule.seconds}
                                        onChange={(e) =>
                                            form.setData(
                                                'scoring_rules',
                                                form.data.scoring_rules.map(
                                                    (r, n) =>
                                                        n === i
                                                            ? {
                                                                  ...r,
                                                                  seconds: Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                              }
                                                            : r,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <label className="flex-1">
                                    <span className="text-xs font-semibold text-slate-700">
                                        Điểm thưởng
                                    </span>
                                    <input
                                        aria-label={`Điểm mốc ${i + 1}`}
                                        type="number"
                                        min={0}
                                        max={10000}
                                        required
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                        value={rule.points}
                                        onChange={(e) =>
                                            form.setData(
                                                'scoring_rules',
                                                form.data.scoring_rules.map(
                                                    (r, n) =>
                                                        n === i
                                                            ? {
                                                                  ...r,
                                                                  points: Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                              }
                                                            : r,
                                                ),
                                            )
                                        }
                                    />
                                </label>
                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    disabled={form.data.scoring_rules.length <= 1}
                                    onClick={() => handleDeleteRule(i)}
                                    title={form.data.scoring_rules.length <= 1 ? 'Cần giữ ít nhất 1 mốc điểm' : 'Xóa mốc điểm này'}
                                    icon={<Trash2 className="h-4 w-4" />}
                                    className="h-[38px] px-3"
                                >
                                    Xóa
                                </Button>
                            </div>
                        ))}
                    </div>
                </fieldset>
                {Object.entries(form.errors).map(([key, error]) => (
                    <p key={key} role="alert" className="text-sm text-rose-600">
                        {error}
                    </p>
                ))}
                <Button
                    type="submit"
                    variant="success"
                    isLoading={form.processing}
                    disabled={form.processing}
                    className="w-full rounded-xl py-3 text-base font-bold"
                >
                    Tạo phòng chơi
                </Button>
            </form>
        </AppLayout>
    );
}
