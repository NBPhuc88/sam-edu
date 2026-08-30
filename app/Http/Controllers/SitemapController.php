<?php

namespace App\Http\Controllers;

use App\Helpers\SeoHelper;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Xuất file Sitemap XML động phục vụ Googlebot thu thập dữ liệu.
     */
    public function index(): Response
    {
        $today = now()->toIso8601String();

        $urls = [
            [
                'loc'        => SeoHelper::canonicalUrl('/'),
                'lastmod'    => $today,
                'changefreq' => 'daily',
                'priority'   => '1.0',
            ],
            [
                'loc'        => SeoHelper::canonicalUrl('/services'),
                'lastmod'    => $today,
                'changefreq' => 'weekly',
                'priority'   => '0.9',
            ],
            [
                'loc'        => SeoHelper::canonicalUrl('/about'),
                'lastmod'    => $today,
                'changefreq' => 'monthly',
                'priority'   => '0.8',
            ],
            [
                'loc'        => SeoHelper::canonicalUrl('/contact'),
                'lastmod'    => $today,
                'changefreq' => 'monthly',
                'priority'   => '0.8',
            ],
            [
                'loc'        => SeoHelper::canonicalUrl('/register-center'),
                'lastmod'    => $today,
                'changefreq' => 'weekly',
                'priority'   => '0.9',
            ],
            [
                'loc'        => SeoHelper::canonicalUrl('/login'),
                'lastmod'    => $today,
                'changefreq' => 'monthly',
                'priority'   => '0.5',
            ],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
        $xml .= 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . htmlspecialchars($url['loc']) . '</loc>' . "\n";
            $xml .= '    <lastmod>' . $url['lastmod'] . '</lastmod>' . "\n";
            $xml .= '    <changefreq>' . $url['changefreq'] . '</changefreq>' . "\n";
            $xml .= '    <priority>' . $url['priority'] . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'text/xml; charset=UTF-8',
        ]);
    }
}
