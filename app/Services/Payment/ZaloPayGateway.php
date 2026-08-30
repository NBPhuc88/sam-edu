<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;

class ZaloPayGateway implements PaymentGatewayInterface
{
    /**
     * Khởi tạo đơn hàng ZaloPay QR Code v2.
     *
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createOrder(array $data): array
    {
        $amount     = (int) ($data['amount'] ?? 0);
        $appTransId = (string) ($data['app_trans_id'] ?? '');
        $centerId   = (int) ($data['center_id'] ?? 0);
        $planId     = (int) ($data['plan_id'] ?? 0);
        $centerName = (string) ($data['center_name'] ?? '');
        $planName   = (string) ($data['plan_name'] ?? '');

        $appUser = 'Center_' . $centerId;
        $appTime = round(microtime(true) * 1000);

        $appId    = config('zalopay.app_id', 2553);
        $key1     = config('zalopay.key1', 'SdngDkWbFcGkwngAssBZffBmMinwAKL5');
        $endpoint = config('zalopay.endpoint', 'https://sb-openapi.zalopay.vn/v2/create');

        $embedData = json_encode([
            'redirecturl' => config('app.url') . '/services',
            'center_id'   => $centerId,
            'plan_id'     => $planId,
        ]);
        $items = json_encode([[
            'itemid'       => (string) $planId,
            'itemname'     => $planName ?: ('Gói dịch vụ #' . $planId),
            'itemprice'    => $amount,
            'itemquantity' => 1,
        ]]);

        $param = [
            'app_id'       => (int) $appId,
            'app_user'     => $appUser,
            'app_time'     => $appTime,
            'amount'       => $amount,
            'app_trans_id' => $appTransId,
            'embed_data'   => $embedData,
            'item'         => $items,
            'description'  => "Thanh toan goi {$planName} cho Trung tam {$centerName}",
            'bank_code'    => 'zalopayapp',
        ];

        $rawStr       = $param['app_id'] . '|' . $param['app_trans_id'] . '|' . $param['app_user'] . '|' . $param['amount'] . '|' . $param['app_time'] . '|' . $param['embed_data'] . '|' . $param['item'];
        $param['mac'] = hash_hmac('sha256', $rawStr, (string) $key1);

        $orderUrl = null;
        $qrCode   = null;

        try {
            $response = Http::post($endpoint, $param);

            if ($response->successful()) {
                $resData = $response->json();

                if (isset($resData['return_code']) && $resData['return_code'] === 1) {
                    $orderUrl = $resData['order_url'] ?? null;
                    $qrCode   = $resData['qr_code'] ?? null;
                }
            }
        } catch (\Throwable $e) {
            $orderUrl = "https://qcgateway.zalopay.vn/pay?order={$appTransId}";
        }

        return [
            'provider'     => 'zalopay',
            'order_url'    => $orderUrl,
            'qr_code'      => $qrCode,
            'instructions' => 'Quét mã QR bằng ứng dụng ZaloPay hoặc Camera điện thoại để thanh toán.',
        ];
    }

    /**
     * Kiểm tra trạng thái đơn hàng ZaloPay v2.
     *
     * @param  string               $transactionCode
     * @return array<string, mixed>
     */
    public function checkStatus(string $transactionCode): array
    {
        $appId    = config('zalopay.app_id', 2553);
        $key1     = config('zalopay.key1', 'SdngDkWbFcGkwngAssBZffBmMinwAKL5');
        $endpoint = 'https://sb-openapi.zalopay.vn/v2/query';

        $data = $appId . '|' . $transactionCode . '|' . $key1;
        $mac  = hash_hmac('sha256', $data, (string) $key1);

        try {
            $response = Http::post($endpoint, [
                'app_id'       => (int) $appId,
                'app_trans_id' => $transactionCode,
                'mac'          => $mac,
            ]);

            if ($response->successful() && $response->json('return_code') === 1) {
                return ['success' => true, 'status' => 'paid'];
            }
        } catch (\Throwable $e) {
            // Ignore API network errors during polling
        }

        return ['success' => false, 'status' => 'pending'];
    }
}
