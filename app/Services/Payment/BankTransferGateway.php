<?php

namespace App\Services\Payment;

class BankTransferGateway implements PaymentGatewayInterface
{
    /**
     * Khởi tạo đơn hàng chuyển khoản ngân hàng VietQR.
     *
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createOrder(array $data): array
    {
        $amount     = (int) ($data['amount'] ?? 0);
        $appTransId = (string) ($data['app_trans_id'] ?? '');

        // Cấu hình tài khoản ngân hàng mặc định của Sam Edu
        $bankId       = config('payment.bank.bank_id', 'ICB'); // VietinBank / MB / Vietcombank
        $accountNo    = config('payment.bank.account_no', '1008889999');
        $accountName  = config('payment.bank.account_name', 'CONG TY CP GIAO DUC SAM');
        $transferMemo = 'SAM ' . $appTransId;

        // Sinh mã VietQR tĩnh/động chuẩn Napas247 qua vietqr.io API
        $vietQrUrl = "https://img.vietqr.io/image/{$bankId}-{$accountNo}-compact2.png?amount={$amount}&addInfo=" . urlencode($transferMemo) . '&accountName=' . urlencode($accountName);

        return [
            'provider'      => 'bank_transfer',
            'qr_code'       => $vietQrUrl,
            'bank_name'     => 'Ngân hàng VietinBank (Công thương Việt Nam)',
            'account_no'    => $accountNo,
            'account_name'  => $accountName,
            'transfer_memo' => $transferMemo,
            'instructions'  => "Dùng ứng dụng Mobile Banking quét mã VietQR hoặc chuyển khoản đúng Số TK và Nội dung: {$transferMemo}",
        ];
    }

    /**
     * Kiểm tra trạng thái chuyển khoản ngân hàng.
     *
     * @param  string               $transactionCode
     * @return array<string, mixed>
     */
    public function checkStatus(string $transactionCode): array
    {
        // Trong môi trường sandbox / demo, trả về pending trừ khi đã có xác nhận hệ thống
        return ['success' => false, 'status' => 'pending'];
    }
}
