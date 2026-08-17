<?php

namespace App\Services\Home;

interface HomeServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function getLandingPageData(): array;

    /**
     * @return array<string, mixed>
     */
    public function getServicesPageData(): array;

    /**
     * @return array<string, mixed>
     */
    public function getAboutPageData(): array;

    /**
     * @return array<string, mixed>
     */
    public function getContactPageData(): array;
}
