import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
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

    return (
        <AppLayout title="Tạo đấu trường">
            <form
                className="mx-auto max-w-2xl space-y-6 p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(store.url());
                }}
            >
                <Link href={index()} className="text-sm text-emerald-700">
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
                    Thời gian trả lời mỗi câu (15–30 giây)
                    <input
                        className="mt-2 w-full rounded-xl border p-3"
                        type="number"
                        min={15}
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
                    <legend className="mb-3 font-bold">
                        Thang điểm tốc độ
                    </legend>
                    {form.data.scoring_rules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <label className="flex-1">
                                Dưới (giây)
                                <input
                                    aria-label={`Mốc thời gian ${i + 1}`}
                                    type="number"
                                    min={0.1}
                                    max={30}
                                    step={0.1}
                                    required
                                    className="mt-1 w-full rounded-lg border p-2"
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
                                Điểm
                                <input
                                    aria-label={`Điểm mốc ${i + 1}`}
                                    type="number"
                                    min={0}
                                    max={10000}
                                    required
                                    className="mt-1 w-full rounded-lg border p-2"
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
                        </div>
                    ))}
                </fieldset>
                {Object.entries(form.errors).map(([key, error]) => (
                    <p key={key} role="alert" className="text-sm text-rose-600">
                        {error}
                    </p>
                ))}
                <button
                    disabled={form.processing}
                    className="w-full rounded-xl bg-emerald-600 p-4 font-bold text-white"
                >
                    Tạo phòng chơi
                </button>
            </form>
        </AppLayout>
    );
}
