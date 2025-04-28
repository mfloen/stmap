const https = require('https'); // Untuk melakukan request HTTP

exports.handler = async function(event, context) {
  // Ambil domain yang digunakan untuk mengakses situs
  const currentDomain = event.headers['x-forwarded-proto'] === 'https'
    ? `https://${event.headers['host']}`
    : `http://${event.headers['host']}`;

  // Fungsi untuk membaca file dari URL
  const readFile = (fileName) => {
    return new Promise((resolve, reject) => {
      https.get(`${currentDomain}/static/${fileName}`, (response) => {
        let data = '';
        response.on('data', chunk => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
        response.on('error', (err) => {
          reject(err);
        });
      });
    });
  };

  try {
    // Ambil isi dari list-url.txt dan keywords.txt
    const listDomains = (await readFile('list-url.txt')).split('\n').map(line => line.trim()).filter(line => line);
    const keywords = (await readFile('keywords.txt')).split('\n').map(line => line.trim()).filter(line => line);

    // Cek apakah domain saat ini diizinkan
    if (!listDomains.includes(currentDomain)) {
      return {
        statusCode: 403,
        body: 'Domain not allowed.',
      };
    }

    // Setiap sitemap dapat memuat hingga 1000 URL
    const chunkSize = 1000;
    const totalSitemaps = Math.ceil(keywords.length / chunkSize);

    const part = parseInt(event.queryStringParameters && event.queryStringParameters.part) || 0;

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

    const partIndex = part - 1;
    if (partIndex < 0 || partIndex >= totalSitemaps) {
      return {
        statusCode: 404,
        body: 'Sitemap part not found.',
      };
    }

    const sitemapKeywords = keywords.slice(partIndex * chunkSize, (partIndex + 1) * chunkSize);

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
  } catch (err) {
    console.error("Error reading files:", err);
    return {
      statusCode: 500,
      body: 'Internal server error.',
    };
  }
};
