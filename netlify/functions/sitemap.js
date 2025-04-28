// netlify/functions/sitemap.js
const fs = require('fs');

// Function handler for the sitemap generation
exports.handler = async function(event, context) {
  // Load the domain list and keyword list
  const listDomains = fs.readFileSync('list-url.txt', 'utf8').split('\n').map(line => line.trim()).filter(line => line);
  const keywords = fs.readFileSync('keywords.txt', 'utf8').split('\n').map(line => line.trim()).filter(line => line);

  // Get the current domain
  const currentDomain = event.headers['x-forwarded-proto'] === 'https'
    ? `https://${event.headers['host']}`
    : `http://${event.headers['host']}`;

  // Check if the current domain is allowed
  if (!listDomains.includes(currentDomain)) {
    return {
      statusCode: 403,
      body: 'Domain not allowed.',
    };
  }

  // Set max URLs per sitemap
  const chunkSize = 1000;
  const totalSitemaps = Math.ceil(keywords.length / chunkSize);

  // Check for sitemap part (e.g., ?part=2)
  const part = parseInt(event.queryStringParameters && event.queryStringParameters.part) || 0;

  // Output sitemap index if part = 0
  if (part === 0) {
    let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (let i = 1; i <= totalSitemaps; i++) {
      sitemapIndex += `  <sitemap>\n    <loc>${currentDomain}/.netlify/functions/sitemap?part=${i}</loc>\n  </sitemap>\n`;
    }

    sitemapIndex += '</sitemapindex>';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml' },
      body: sitemapIndex,
    };
  }

  // Output specific sitemap part
  const partIndex = part - 1;
  if (partIndex < 0 || partIndex >= totalSitemaps) {
    return {
      statusCode: 404,
      body: 'Sitemap part not found.',
    };
  }

  // Slice the keywords to create a sitemap part
  const sitemapKeywords = keywords.slice(partIndex * chunkSize, (partIndex + 1) * chunkSize);

  // Generate the sitemap XML
  let sitemapXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXML += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemapKeywords.forEach(keyword => {
    const slug = keyword.replace(/\s+/g, '-').toLowerCase();
    const url = `${currentDomain}/${slug}`;
    sitemapXML += `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  sitemapXML += '</urlset>';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: sitemapXML,
  };
};
