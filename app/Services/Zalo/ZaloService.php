<?php

namespace App\Services\Zalo;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class ZaloService implements ZaloServiceInterface
{
    protected string $appId;

    protected string $key1;

    protected string $key2;

    protected string $endpoint;

    protected string $queryEndpoint;

    protected string $callbackUrl;

    public function __construct()
    {
        $this->appId = (string) config('services.zalopay.app_id');
        $this->key1 = (string) config('services.zalopay.key1');
        $this->key2 = (string) config('services.zalopay.key2');
        $this->endpoint = (string) config('services.zalopay.endpoint');
        $this->queryEndpoint = (string) config('services.zalopay.query_endpoint');
        $this->callbackUrl = (string) config('services.zalopay.callback_url');
    }

    /**
     * Create a ZaloPay payment order.
     *
     * @param  string  $appTransId  Format: YYMMDD_xxxxx
     * @param  string  $appUser  Username or ID
     * @param  int  $amount  Amount in VND
     * @param  string  $description  Order description
     * @param  array<string, mixed>  $embedData  Embed data (redirecturl, etc.)
     * @param  array<int, mixed>  $items  Items list
     * @return array<string, mixed>
     */
    public function createOrder(
        string $appTransId,
        string $appUser,
        int $amount,
        string $description,
        array $embedData = [],
        array $items = []
    ): array {
        $appTime = (int) round(microtime(true) * 1000);
        $embedDataJson = json_encode($embedData, JSON_UNESCAPED_UNICODE) ?: '{}';
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE) ?: '[]';

        $dataToSign = implode('|', [
            $this->appId,
            $appTransId,
            $appUser,
            $amount,
            $appTime,
            $embedDataJson,
            $itemsJson,
        ]);

        $mac = hash_hmac('sha256', $dataToSign, $this->key1);

        $orderPayload = [
            'app_id' => (int) $this->appId,
            'app_user' => $appUser,
            'app_time' => $appTime,
            'amount' => $amount,
            'app_trans_id' => $appTransId,
            'embed_data' => $embedDataJson,
            'item' => $itemsJson,
            'description' => $description,
            'bank_code' => '',
            'mac' => $mac,
            'callback_url' => $this->callbackUrl,
        ];

        /** @var Response $response */
        $response = Http::asForm()->post($this->endpoint, $orderPayload);

        /** @var array<string, mixed> $result */
        $result = $response->json();

        return $result;
    }

    /**
     * Verify callback signature from ZaloPay.
     *
     * @param  string  $data  Json string data from callback
     * @param  string  $mac  Mac signature from callback
     */
    public function verifyCallback(string $data, string $mac): bool
    {
        $computedMac = hash_hmac('sha256', $data, $this->key2);

        return hash_equals($computedMac, $mac);
    }

    /**
     * Query ZaloPay payment status.
     *
     * @return array<string, mixed>
     */
    public function queryStatus(string $appTransId): array
    {
        $timestamp = (int) round(microtime(true) * 1000);
        $dataToSign = $this->appId.'|'.$appTransId.'|'.$this->key1;
        $mac = hash_hmac('sha256', $dataToSign, $this->key1);

        $params = [
            'app_id' => (int) $this->appId,
            'app_trans_id' => $appTransId,
            'timestamp' => $timestamp,
            'mac' => $mac,
        ];

        /** @var Response $response */
        $response = Http::asForm()->post($this->queryEndpoint, $params);

        /** @var array<string, mixed> $result */
        $result = $response->json();

        return $result;
    }
}
