<?php

namespace App\Services\Zalo;

interface ZaloServiceInterface
{
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
    ): array;

    /**
     * Verify callback signature from ZaloPay.
     *
     * @param  string  $data  Json string data from callback
     * @param  string  $mac  Mac signature from callback
     */
    public function verifyCallback(string $data, string $mac): bool;

    /**
     * Query ZaloPay payment status.
     *
     * @return array<string, mixed>
     */
    public function queryStatus(string $appTransId): array;
}
