<?php
// Get current domain
$currentDomain = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];

// Set plain text header
header("Content-Type: text/plain");

// Output robots.txt content
echo "User-agent: *\n";
echo "Disallow:\n";
echo "Sitemap: {$currentDomain}/sitemap.php\n";
