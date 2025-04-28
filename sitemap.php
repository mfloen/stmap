<?php
// Load domain list and keyword list
$listDomains = file('list-url.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$keywords = file('keywords.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

// Get the domain used to access the site
$currentDomain = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];

// Check if current domain is allowed
if (!in_array($currentDomain, $listDomains)) {
    header("HTTP/1.1 403 Forbidden");
    echo "Domain not allowed.";
    exit;
}

// Set max URLs per sitemap
$chunkSize = 1000;
$totalSitemaps = ceil(count($keywords) / $chunkSize);

// Check for sitemap part (e.g., ?part=2)
$part = isset($_GET['part']) ? (int)$_GET['part'] : 0;

// Output sitemap index
if ($part === 0) {
    header("Content-Type: application/xml; charset=utf-8");
    echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
    echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

    for ($i = 1; $i <= $totalSitemaps; $i++) {
        echo "  <sitemap>\n";
        echo "    <loc>{$currentDomain}/sitemap.php?part={$i}</loc>\n";
        echo "  </sitemap>\n";
    }

    echo '</sitemapindex>';
    exit;
}

// Output specific sitemap part
$partIndex = $part - 1;
if ($partIndex < 0 || $partIndex >= $totalSitemaps) {
    header("HTTP/1.1 404 Not Found");
    echo "Sitemap part not found.";
    exit;
}

$sitemapKeywords = array_slice($keywords, $partIndex * $chunkSize, $chunkSize);

// Output the sitemap XML
header("Content-Type: application/xml; charset=utf-8");
echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

foreach ($sitemapKeywords as $keyword) {
    // Replace spaces with hyphens without trimming the string
    $slug = preg_replace('/\s+/', '-', $keyword); // Replaces spaces with hyphens
    $slug = strtolower($slug); // Make it lowercase
    $url = $currentDomain . '/' . $slug; // Updated URL without '.html'
    echo "  <url>\n";
    echo "    <loc>$url</loc>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.8</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>';
?>
