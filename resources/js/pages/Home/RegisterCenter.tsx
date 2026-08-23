import {
    Building,
    CheckCircle2,
    Clock,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Send,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PublicLayout from '../../layouts/PublicLayout';
import apiClient from '../../lib/axios';
import { isValidVietnamesePhone } from '../../utils/validation';

interface RegisterCenterProps {
    contactInfo?: {
        company_name?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    enableOnlinePayment?: boolean;
    paymentGateways?: Record<string, boolean>;
}

export const RegisterCenter: React.FC<RegisterCenterProps> = ({
    contactInfo,
    enableOnlinePayment = false,
}) => {
    // Current Onboarding Wizard Step: 1 | 2 | 3 (1: Form, 2: Payment, 3: Success Confirmation)
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Step 1 Form State
    const [centerName, setCenterName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const planParam = params.get('plan');

            if (
                planParam &&
                ['trial', 'basic_5', 'basic_20', 'advanced_5', 'advanced_20'].includes(planParam)
            ) {
                return planParam;
            }
        }

        return 'trial';
    });
    const [paymentMethod, setPaymentMethod] = useState<
        'zalopay' | 'bank_transfer' | 'momo' | 'vnpay'
    >('zalopay');

    // Step 2 / Notification Info State
    const [appTransId, setAppTransId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [bankName, setBankName] = useState<string | null>(null);
    const [accountNo, setAccountNo] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string | null>(null);
    const [transferMemo, setTransferMemo] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [planName, setPlanName] = useState<string>('');
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

    // Success notification state
    const [registeredCenter, setRegisteredCenter] = useState<any>(null);

    /**
     * Submit Step 1: Điền thông tin trung tâm & chọn gói cước
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

        if (!isValidVietnamesePhone(phone)) {
            setErrorMessage('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678 hoặc +84912345678).');
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

                if (res.data.step === 'contact_notification') {
                    // Thành công ngay (Dùng thử hoặc phương thức khác)
                    setRegisteredCenter({
                        code: res.data.code,
                        name: res.data.name,
                        plan: res.data.plan || selectedPlan,
                    });
                    setCurrentStep(3); // Screen Step 3: Success confirmation
                } else if (res.data.step === 'payment_gateway') {
                    // Gói trả phí + Bật thanh toán -> Sang Step 2 cổng thanh toán
                    setAppTransId(res.data.app_trans_id);
                    setQrCode(res.data.qr_code);
                    setBankName(res.data.bank_name);
                    setAccountNo(res.data.account_no);
                    setAccountName(res.data.account_name);
                    setTransferMemo(res.data.transfer_memo);
                    setPaymentAmount(res.data.amount);
                    setPlanName(res.data.plan_name);
                    setRegisteredCenter({
                        code: res.data.code,
                        name: res.data.name,
                        plan: selectedPlan,
                    });
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
     * Polling kiểm tra trạng thái thanh toán trực tuyến (Step 2)
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
                        setRegisteredCenter({
                            code: res.data.code || registeredCenter?.code,
                            name: res.data.name || registeredCenter?.name,
                            plan: res.data.plan || selectedPlan,
                        });
                        clearInterval(intervalId);
                        setTimeout(() => {
                            setCurrentStep(3);
                        }, 1500);
                    }
                } catch {
                    // Ignore polling error
                }
            }, 3000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentStep, appTransId, isPaymentSuccess, registeredCenter, selectedPlan]);

    return (
        <PublicLayout title="Đăng Ký Trung Tâm Mới - Giáo Dục Sam">
            {/* Header */}
            <section className="border-b border-gray-200 bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Đăng Ký Trung Tâm Mới
                    </h1>
                    <p className="mx-auto max-w-xl text-sm text-gray-600">
                        Khởi tạo thông tin trung tâm đào tạo, chọn gói dịch vụ
                        phù hợp và trải nghiệm ngay giải pháp quản lý giáo dục
                        2026.
                    </p>
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
                                    Thông Tin Hỗ Trợ
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
                                                {contactInfo?.address ||
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
                                                {contactInfo?.phone ||
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
                                                {contactInfo?.email ||
                                                    'phucstt01@gmail.com'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-xs text-emerald-900">
                                <h4 className="font-bold">
                                    Quyền lợi đăng ký:
                                </h4>
                                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-emerald-800">
                                    <li>
                                        Khởi tạo mã quản lý trung tâm tức thì
                                    </li>
                                    <li>
                                        14 ngày dùng thử miễn phí đầy đủ tính
                                        năng
                                    </li>
                                    <li>
                                        Được hỗ trợ chuyển đổi dữ liệu học sinh
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Onboarding Wizard Container */}
                        <div className="lg:col-span-2">
                            <Card className="border-gray-200 p-6 shadow-sm sm:p-8">
                                {errorMessage && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* ── STEP 1: Form Đăng ký thông tin Trung tâm & Chọn Gói ─────────── */}
                                {currentStep === 1 && (
                                    <form
                                        onSubmit={handleStep1Submit}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Thông tin Đăng ký Trung tâm
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Điền thông tin cơ bản để khởi
                                                tạo trung tâm của bạn trên hệ
                                                thống
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
                                                maxLength={100}
                                                required
                                            />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                                                <Input
                                                    label="Số điện thoại liên hệ (*)"
                                                    placeholder="0912345678"
                                                    value={phone}
                                                    onChange={(e) =>
                                                        setPhone(e.target.value)
                                                    }
                                                    maxLength={15}
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
                                                    maxLength={100}
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
                                                maxLength={255}
                                            />
                                        </div>

                                        {/* Plan Selection */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-bold text-gray-800">
                                                Chọn gói cước trải nghiệm (*):
                                            </label>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {/* Trial */}
                                                <div
                                                    onClick={() => setSelectedPlan('trial')}
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan === 'trial'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                            DÙNG THỬ 1 THÁNG
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={selectedPlan === 'trial'}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        Miễn phí 0đ
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        30 ngày · Tối đa 20 lớp · 600 HS (Full tính năng)
                                                    </p>
                                                </div>

                                                {/* Basic 5 */}
                                                <div
                                                    onClick={() => setSelectedPlan('basic_5')}
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan === 'basic_5'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                                                            CƠ BẢN · 5 LỚP
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={selectedPlan === 'basic_5'}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        250.000đ <span className="text-[10px] font-normal text-gray-500">/tháng</span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Tối đa 5 lớp · 150 học sinh
                                                    </p>
                                                </div>

                                                {/* Basic 20 */}
                                                <div
                                                    onClick={() => setSelectedPlan('basic_20')}
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan === 'basic_20'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                                                            CƠ BẢN · 20 LỚP
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={selectedPlan === 'basic_20'}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        500.000đ <span className="text-[10px] font-normal text-gray-500">/tháng</span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Tối đa 20 lớp · 600 học sinh
                                                    </p>
                                                </div>

                                                {/* Advanced 5 */}
                                                <div
                                                    onClick={() => setSelectedPlan('advanced_5')}
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                        selectedPlan === 'advanced_5'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                                                            NÂNG CAO · 5 LỚP
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={selectedPlan === 'advanced_5'}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        500.000đ <span className="text-[10px] font-normal text-gray-500">/tháng</span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        5 lớp · 150 HS (Đề thi + Chat + CSV)
                                                    </p>
                                                </div>

                                                {/* Advanced 20 */}
                                                <div
                                                    onClick={() => setSelectedPlan('advanced_20')}
                                                    className={`cursor-pointer rounded-xl border p-4 transition-all sm:col-span-2 lg:col-span-2 ${
                                                        selectedPlan === 'advanced_20'
                                                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                                                            ⭐ NÂNG CAO · 20 LỚP (PHỔ BIẾN)
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            checked={selectedPlan === 'advanced_20'}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-base font-bold text-gray-900">
                                                        1.000.000đ <span className="text-[10px] font-normal text-gray-500">/tháng (hoặc 9.600.000đ/năm - Giảm 20%)</span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        20 lớp · 600 HS · Toàn bộ tính năng cao cấp & hỗ trợ 24/7
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Method Selection (Khi bật thanh toán trực tuyến) */}
                                        {enableOnlinePayment &&
                                            selectedPlan !== 'trial' && (
                                                <div className="space-y-3 pt-2">
                                                    <label className="block text-xs font-bold text-gray-800">
                                                        Chọn phương thức thanh
                                                        toán (*):
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        <div
                                                            onClick={() =>
                                                                setPaymentMethod(
                                                                    'zalopay',
                                                                )
                                                            }
                                                            className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                                paymentMethod ===
                                                                'zalopay'
                                                                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-bold text-gray-900">
                                                                ZaloPay QR
                                                            </div>
                                                        </div>

                                                        <div
                                                            onClick={() =>
                                                                setPaymentMethod(
                                                                    'bank_transfer',
                                                                )
                                                            }
                                                            className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                                                paymentMethod ===
                                                                'bank_transfer'
                                                                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-bold text-gray-900">
                                                                VietQR Ngân hàng
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="lg"
                                            isLoading={loading}
                                            className="w-full justify-center py-3"
                                            icon={<Send className="h-5 w-5" />}
                                        >
                                            Gửi Đăng Ký Trung Tâm
                                        </Button>
                                    </form>
                                )}

                                {/* ── STEP 2: Cổng Thanh toán Linh hoạt ────────────────────────────── */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 text-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Bước 2: Thanh Toán Kích Hoạt Gói{' '}
                                                {planName}
                                            </h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Phương thức:{' '}
                                                <span className="font-bold text-emerald-800 uppercase">
                                                    {paymentMethod ===
                                                    'bank_transfer'
                                                        ? 'Chuyển khoản VietQR'
                                                        : paymentMethod}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-emerald-200 bg-slate-50 p-6 shadow-sm">
                                            <div className="text-xs text-gray-600">
                                                Số tiền thanh toán:
                                            </div>
                                            <div className="text-3xl font-black text-emerald-700">
                                                {paymentAmount.toLocaleString(
                                                    'vi-VN',
                                                )}
                                                đ
                                            </div>

                                            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-inner">
                                                {qrCode && (
                                                    <img
                                                        src={
                                                            qrCode.startsWith(
                                                                'http',
                                                            )
                                                                ? qrCode
                                                                : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`
                                                        }
                                                        alt="Payment QR Code"
                                                        className="h-48 w-48 object-contain"
                                                    />
                                                )}
                                            </div>

                                            {paymentMethod ===
                                                'bank_transfer' && (
                                                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-left text-xs text-gray-800">
                                                    <div>
                                                        <span className="font-semibold text-gray-600">
                                                            Ngân hàng:
                                                        </span>{' '}
                                                        <strong className="text-blue-900">
                                                            {bankName ||
                                                                'VietinBank'}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-600">
                                                            Số tài khoản:
                                                        </span>{' '}
                                                        <strong className="font-mono text-sm text-blue-900 select-all">
                                                            {accountNo ||
                                                                '1008889999'}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-600">
                                                            Chủ tài khoản:
                                                        </span>{' '}
                                                        <strong className="text-blue-900">
                                                            {accountName ||
                                                                'CONG TY CP GIAO DUC SAM'}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-600">
                                                            Nội dung:
                                                        </span>{' '}
                                                        <strong className="font-mono text-sm text-emerald-800 select-all">
                                                            {transferMemo ||
                                                                `SAM ${appTransId}`}
                                                        </strong>
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                variant="success"
                                                size="md"
                                                className="mt-2 w-full justify-center"
                                                onClick={() =>
                                                    setCurrentStep(3)
                                                }
                                            >
                                                Tôi đã hoàn tất chuyển khoản /
                                                thanh toán
                                            </Button>

                                            <div className="flex animate-pulse items-center justify-center gap-2 pt-1 text-xs font-semibold text-emerald-800">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Đang kiểm tra kết quả thanh toán
                                                tự động...
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 3: Thông Báo Xác Nhận Đăng Ký Thành Công ─────────────────── */}
                                {currentStep === 3 && (
                                    <div className="space-y-6 py-6 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-extrabold text-gray-900">
                                                Đăng Ký Trung Tâm Thành Công!
                                            </h2>
                                            <p className="mx-auto max-w-md text-xs leading-relaxed text-gray-600">
                                                Cảm ơn bạn đã đăng ký trung tâm{' '}
                                                <strong className="text-gray-900">
                                                    "{registeredCenter?.name}"
                                                </strong>
                                                . Ban Quản trị Sam Edu đã nhận
                                                được thông tin đăng ký của bạn.
                                            </p>
                                        </div>

                                        <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-emerald-200 bg-slate-50 p-4 text-left text-xs text-gray-800 shadow-xs">
                                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                                <span className="text-gray-500">
                                                    Mã trung tâm:
                                                </span>
                                                <span className="font-mono font-bold text-emerald-800">
                                                    {registeredCenter?.code}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                                <span className="text-gray-500">
                                                    Gói cước đã chọn:
                                                </span>
                                                <span className="font-bold text-gray-900 uppercase">
                                                    {registeredCenter?.plan}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">
                                                    Trạng thái:
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-amber-700">
                                                    <Clock className="h-3.5 w-3.5" />{' '}
                                                    Chờ Ban quản trị kích hoạt
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                variant="secondary"
                                                size="md"
                                                onClick={() => {
                                                    setCurrentStep(1);
                                                    setCenterName('');
                                                    setPhone('');
                                                    setEmail('');
                                                    setAddress('');
                                                }}
                                            >
                                                Đăng ký trung tâm khác
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default RegisterCenter;
