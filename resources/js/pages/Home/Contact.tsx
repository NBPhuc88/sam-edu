import {
    ArrowRight,
    Building,
    CreditCard,
    Lock,
    Mail,
    MapPin,
    Phone,
    QrCode,
    RefreshCw,
    Sparkles,
    User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PublicLayout from '../../layouts/PublicLayout';
import apiClient from '../../lib/axios';

interface ContactProps {
    contactInfo?: {
        company_name?: string;
        contact_address?: string;
        contact_phone?: string;
        contact_email?: string;
    };
}

export const Contact: React.FC<ContactProps> = ({
    contactInfo,
}) => {
    // Current Onboarding Wizard Step: 1 | 2 | 3
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Step 1 Form State
    const [centerName, setCenterName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<
        'trial_14d' | 'monthly' | 'yearly'
    >('trial_14d');

    // Payment Method Selection State
    const [paymentMethod, setPaymentMethod] = useState<
        'zalopay' | 'bank_transfer' | 'momo' | 'vnpay'
    >('zalopay');

    // Step 2 Flexible Payment Info State
    const [centerId, setCenterId] = useState<number | null>(null);
    const [appTransId, setAppTransId] = useState<string | null>(null);
    const [orderUrl, setOrderUrl] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [bankName, setBankName] = useState<string | null>(null);
    const [accountNo, setAccountNo] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string | null>(null);
    const [transferMemo, setTransferMemo] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [planName, setPlanName] = useState<string>('');
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

    // Step 3 Account Setup State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    /**
     * Submit Step 1: Điền thông tin trung tâm & chọn gói cước & chọn PTTT
     */
    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!centerName || !phone || !email) {
            setErrorMessage(
                'Vui lòng điền đầy đủ Tên trung tâm, Số điện thoại và Email.',
            );

            return;
        }

        setLoading(true);

        try {
            const res = await apiClient.post('/register-center/step1', {
                name: centerName,
                phone: phone,
                email: email,
                address: address,
                subscription_plan: selectedPlan,
                payment_method: paymentMethod,
            });

            if (res.data?.success) {
                setCenterId(res.data.center_id);

                if (res.data.step === 'complete_account') {
                    // Gói Dùng thử 14 ngày (0đ) -> Chuyển thẳng sang Step 3 tạo tài khoản
                    setCurrentStep(3);
                } else if (res.data.step === 'payment_gateway') {
                    // Gói trả phí -> Sang Step 2 hiển thị cổng thanh toán linh hoạt
                    setAppTransId(res.data.app_trans_id);
                    setOrderUrl(res.data.order_url);
                    setQrCode(res.data.qr_code);
                    setBankName(res.data.bank_name);
                    setAccountNo(res.data.account_no);
                    setAccountName(res.data.account_name);
                    setTransferMemo(res.data.transfer_memo);
                    setPaymentAmount(res.data.amount);
                    setPlanName(res.data.plan_name);
                    setCurrentStep(2);
                }
            } else {
                setErrorMessage(
                    res.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
                );
            }
        } catch (err: any) {
            setErrorMessage(
                err.response?.data?.message ||
                    'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Polling kiểm tra trạng thái thanh toán ZaloPay (Step 2)
     */
    useEffect(() => {
        let intervalId: any = null;

        if (currentStep === 2 && appTransId && !isPaymentSuccess) {
            intervalId = setInterval(async () => {
                try {
                    const res = await apiClient.get(
                        `/register-center/check-payment/${appTransId}`,
                    );

                    if (res.data?.status === 'paid') {
                        setIsPaymentSuccess(true);
                        clearInterval(intervalId);
                        // Chuyển sang Step 3 tạo tài khoản sau 1.5 giây
                        setTimeout(() => {
                            setCurrentStep(3);
                        }, 1500);
                    }
                } catch {
                    // Ignore polling errors
                }
            }, 3000);
        }

        return () => {
            if (intervalId) {
clearInterval(intervalId);
}
        };
    }, [currentStep, appTransId, isPaymentSuccess]);

    /**
     * Submit Step 3: Tạo username & password -> Tự động đăng nhập
     */
    const handleStep3Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!username || !password) {
            setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu.');

            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không trùng khớp.');

            return;
        }

        setLoading(true);

        try {
            const res = await apiClient.post(
                '/register-center/complete-account',
                {
                    center_id: centerId,
                    username: username,
                    password: password,
                },
            );

            if (res.data?.success && res.data?.redirect_url) {
                // Tự động chuyển hướng vào Trang Quản Trị Dashboard của Trung Tâm
                window.location.assign(res.data.redirect_url);
            } else {
                setErrorMessage(
                    res.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.',
                );
            }
        } catch (err: any) {
            setErrorMessage(
                err.response?.data?.message ||
                    'Không thể tạo tài khoản. Vui lòng kiểm tra lại.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <PublicLayout title="Đăng Ký Trung Tâm Mới & Trải Nghiệm - Giáo Dục Sam">
            {/* Header */}
            <section className="border-b border-gray-200 bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Đăng Ký Trung Tâm Mới
                    </h1>
                    <p className="mx-auto max-w-xl text-sm text-gray-600">
                        Khởi tạo thông tin trung tâm đào tạo, chọn gói dịch vụ
                        phù hợp và trải nghiệm ngay nền tảng quản lý giáo dục
                        2026.
                    </p>

                    {/* Step Wizard Bar */}
                    <div className="mx-auto flex max-w-md items-center justify-center gap-2 pt-4">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 1
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            1
                        </div>
                        <span
                            className={`h-1 w-12 rounded-full ${
                                currentStep >= 2
                                    ? 'bg-emerald-600'
                                    : 'bg-gray-200'
                            }`}
                        />
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 2
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            2
                        </div>
                        <span
                            className={`h-1 w-12 rounded-full ${
                                currentStep >= 3
                                    ? 'bg-emerald-600'
                                    : 'bg-gray-200'
                            }`}
                        />
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 3
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            3
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Information Sidebar */}
                        <div className="space-y-6">
                            <Card className="space-y-4 border-gray-200 p-6">
                                <h3 className="border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                                    Thông Tin Trụ Sở
                                </h3>

                                <div className="space-y-4 text-xs text-gray-700">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Đơn vị chủ quản
                                            </div>
                                            <div>
                                                {contactInfo?.company_name ||
                                                    'Công ty Cổ phần Giáo dục Sam'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Địa chỉ trụ sở
                                            </div>
                                            <div>
                                                {contactInfo?.contact_address ||
                                                    'Tòa nhà Sam Tower, Cầu Giấy, Hà Nội'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Hotline tư vấn 24/7
                                            </div>
                                            <div className="font-bold text-emerald-700">
                                                {contactInfo?.contact_phone ||
                                                    '0988.123.456'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Email hỗ trợ
                                            </div>
                                            <div>
                                                {contactInfo?.contact_email ||
                                                    'hotro@giaoducsam.vn'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-xs text-emerald-900">
                                <h4 className="font-bold">
                                    Quyền lợi dành cho Trung tâm mới:
                                </h4>
                                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-emerald-800">
                                    <li>
                                        14 ngày dùng thử miễn phí không rủi ro
                                    </li>
                                    <li>Thanh toán ZaloPay QR tự động 24/7</li>
                                    <li>
                                        Khởi tạo tài khoản trung tâm tức thì
                                    </li>
                                    <li>Hỗ trợ chuyển đổi dữ liệu học sinh</li>
                                </ul>
                            </div>
                        </div>

                        {/* Onboarding Form Wizard Container */}
                        <div className="lg:col-span-2">
                            <Card className="border-gray-200 p-6 shadow-sm sm:p-8">
                                {errorMessage && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* ── STEP 1: Thông tin Trung tâm & Chọn Gói ──────────────────── */}
                                {currentStep === 1 && (
                                    <form
                                        onSubmit={handleStep1Submit}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Bước 1: Thông tin Trung tâm &
                                                Chọn Gói
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Điền thông tin cơ bản để đăng ký
                                                trung tâm của bạn trên hệ thống
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <Input
                                                label="Tên trung tâm đào tạo (*)"
                                                placeholder="VD: Trung tâm Ngoại ngữ Sam Cầu Giấy"
                                                value={centerName}
                                                onChange={(e) =>
                                                    setCenterName(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <Input
                                                    label="Số điện thoại liên hệ (*)"
                                                    placeholder="0912345678"
                                                    value={phone}
                                                    onChange={(e) =>
                                                        setPhone(e.target.value)
                                                    }
                                                    required
                                                />
                                                <Input
                                                    label="Email đăng ký (*)"
                                                    type="email"
                                                    placeholder="contact@center.edu.vn"
                                                    value={email}
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                    required
                                                />
                                            </div>

                                            <Input
                                                label="Địa chỉ trung tâm"
                                                placeholder="VD: Số 100 Cầu Giấy, Hà Nội"
                                                value={address}
                                                onChange={(e) =>
                                                    setAddress(e.target.value)
                                                }
                                            />
                                        </div>

                                        {/* Plan Selection Cards */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-bold text-gray-800">
                                                Chọn gói cước trải nghiệm (*):
                                            </label>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                {/* Gói Dùng thử 14 ngày */}
                                                <div
                                                    onClick={() =>
                                                        setSelectedPlan(
                                                            'trial_14d',
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan ===
                                                        'trial_14d'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                            DÙNG THỬ 14 NGÀY
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                selectedPlan ===
                                                                'trial_14d'
                                                            }
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        Miễn phí 0đ
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Trải nghiệm 14 ngày dùng
                                                        thử full tính năng
                                                    </p>
                                                </div>

                                                {/* Gói Hàng tháng */}
                                                <div
                                                    onClick={() =>
                                                        setSelectedPlan(
                                                            'monthly',
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan ===
                                                        'monthly'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                                                            HÀNG THÁNG
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                selectedPlan ===
                                                                'monthly'
                                                            }
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        500.000đ{' '}
                                                        <span className="text-[10px] font-normal text-gray-500">
                                                            /tháng
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Linh hoạt 30 ngày qua
                                                        ZaloPay
                                                    </p>
                                                </div>

                                                {/* Gói Theo năm */}
                                                <div
                                                    onClick={() =>
                                                        setSelectedPlan(
                                                            'yearly',
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan ===
                                                        'yearly'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                                                            TIẾT KIỆM 20%
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                selectedPlan ===
                                                                'yearly'
                                                            }
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        4.800.000đ{' '}
                                                        <span className="text-[10px] font-normal text-gray-500">
                                                            /năm
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Tối ưu nhất cho trung
                                                        tâm
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Method Selection (chỉ hiển thị khi chọn gói trả phí) */}
                                        {selectedPlan !== 'trial_14d' && (
                                            <div className="space-y-3 pt-2">
                                                <label className="block text-xs font-bold text-gray-800">
                                                    Chọn phương thức thanh toán (*):
                                                </label>
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                    {/* ZaloPay */}
                                                    <div
                                                        onClick={() => setPaymentMethod('zalopay')}
                                                        className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                            paymentMethod === 'zalopay'
                                                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-gray-900">ZaloPay QR</div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">ZaloPay App / QR</div>
                                                    </div>

                                                    {/* Chuyển khoản VietQR */}
                                                    <div
                                                        onClick={() => setPaymentMethod('bank_transfer')}
                                                        className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                            paymentMethod === 'bank_transfer'
                                                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-gray-900">VietQR Ngân hàng</div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">Napas247 / Banking</div>
                                                    </div>

                                                    {/* Ví MoMo */}
                                                    <div
                                                        onClick={() => setPaymentMethod('momo')}
                                                        className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                            paymentMethod === 'momo'
                                                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-gray-900">Ví MoMo</div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">MoMo App</div>
                                                    </div>

                                                    {/* VNPay */}
                                                    <div
                                                        onClick={() => setPaymentMethod('vnpay')}
                                                        className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                            paymentMethod === 'vnpay'
                                                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-bold text-gray-900">VNPay QR</div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">VNPay App</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="lg"
                                            isLoading={loading}
                                            className="w-full justify-center"
                                            icon={
                                                <ArrowRight className="h-5 w-5" />
                                            }
                                        >
                                            {selectedPlan === 'trial_14d'
                                                ? 'Đăng ký & Tạo tài khoản ngay'
                                                : 'Tiếp tục đến bước thanh toán'}
                                        </Button>
                                    </form>
                                )}

                                {/* ── STEP 2: Cổng Thanh toán Linh hoạt (Flexible Payment Gateway) ── */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 text-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Bước 2: Thanh Toán Kích Hoạt Gói {planName}
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Phương thức: <span className="font-bold text-emerald-800 uppercase">{paymentMethod === 'bank_transfer' ? 'Chuyển khoản VietQR Ngân hàng' : paymentMethod}</span>
                                            </p>
                                        </div>

                                        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-emerald-200 bg-slate-50 p-6 shadow-sm">
                                            <div className="text-xs text-gray-600">
                                                Số tiền thanh toán:
                                            </div>
                                            <div className="text-3xl font-black text-emerald-700">
                                                {paymentAmount.toLocaleString('vi-VN')}đ
                                            </div>

                                            {/* ZaloPay / VietQR Image display */}
                                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-inner">
                                                {qrCode ? (
                                                    <img
                                                        src={qrCode.startsWith('http') ? qrCode : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                                                        alt="Payment QR Code"
                                                        className="h-48 w-48 object-contain"
                                                    />
                                                ) : (
                                                    <div className="flex h-44 w-44 flex-col items-center justify-center text-center text-gray-400">
                                                        <QrCode className="h-16 w-16 text-emerald-600" />
                                                        <span className="mt-2 text-xs font-semibold text-gray-600">
                                                            Mã QR Thanh Toán
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chuyển khoản VietQR Info */}
                                            {paymentMethod === 'bank_transfer' && (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-left text-xs space-y-2 text-gray-800">
                                                    <div><span className="font-semibold text-gray-600">Ngân hàng:</span> <strong className="text-blue-900">{bankName || 'VietinBank'}</strong></div>
                                                    <div><span className="font-semibold text-gray-600">Số tài khoản:</span> <strong className="text-blue-900 select-all font-mono text-sm">{accountNo || '1008889999'}</strong></div>
                                                    <div><span className="font-semibold text-gray-600">Chủ tài khoản:</span> <strong className="text-blue-900">{accountName || 'CONG TY CP GIAO DUC SAM'}</strong></div>
                                                    <div><span className="font-semibold text-gray-600">Nội dung chuyển khoản:</span> <strong className="text-emerald-800 select-all font-mono text-sm">{transferMemo || `SAM ${appTransId}`}</strong></div>
                                                </div>
                                            )}

                                            {orderUrl && (
                                                <a
                                                    href={orderUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                    Mở Ứng Dụng Thanh Toán Ngay
                                                </a>
                                            )}

                                            {/* Confirm Button for Bank Transfer or Polling */}
                                            <Button
                                                variant="success"
                                                size="md"
                                                className="w-full justify-center mt-2"
                                                onClick={() => setCurrentStep(3)}
                                            >
                                                Tôi đã hoàn tất chuyển khoản / thanh toán
                                            </Button>

                                            {/* Polling Indicator */}
                                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 animate-pulse pt-1">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Đang kiểm tra kết quả thanh toán tự động...
                                            </div>
                                        </div>

                                        {isPaymentSuccess && (
                                            <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-xs font-bold text-emerald-900 animate-bounce">
                                                ✓ Thanh toán thành công! Đang chuyển sang bước tạo tài khoản...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── STEP 3: Tạo Username & Password -> Chuyển vào Dashboard ──── */}
                                {currentStep === 3 && (
                                    <form
                                        onSubmit={handleStep3Submit}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Bước 3: Tạo Mật Khẩu Đăng Nhập
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Thiết lập tên đăng nhập và mật
                                                khẩu để quản lý trung tâm của
                                                bạn
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <Input
                                                label="Tên đăng nhập (Username) (*)"
                                                placeholder="VD: hanoicenter01"
                                                icon={
                                                    <User className="h-4 w-4" />
                                                }
                                                value={username}
                                                onChange={(e) =>
                                                    setUsername(e.target.value)
                                                }
                                                required
                                            />

                                            <Input
                                                label="Mật khẩu đăng nhập (*)"
                                                type="password"
                                                placeholder="••••••••"
                                                icon={
                                                    <Lock className="h-4 w-4" />
                                                }
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                required
                                            />

                                            <Input
                                                label="Xác nhận mật khẩu (*)"
                                                type="password"
                                                placeholder="••••••••"
                                                icon={
                                                    <Lock className="h-4 w-4" />
                                                }
                                                value={confirmPassword}
                                                onChange={(e) =>
                                                    setConfirmPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="lg"
                                            isLoading={loading}
                                            className="w-full justify-center py-3"
                                            icon={
                                                <Sparkles className="h-5 w-5" />
                                            }
                                        >
                                            Hoàn tất & Vấn Đăng nhập Trang Quản
                                            trị
                                        </Button>
                                    </form>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Contact;
