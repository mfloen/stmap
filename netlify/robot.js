// netlify/functions/robots.js

exports.handler = async function(event, context) {
  // Get current domain
  const currentDomain = event.headers['x-forwarded-proto'] === 'https' 
    ? `https://${event.headers['host']}`
    : `http://${event.headers['host']}`;

  // Set plain text header
  const headers = {
    'Content-Type': 'text/plain',
  };

  // Output robots.txt content
  const body = `User-agent: *
Disallow:
Sitemap: ${currentDomain}/sitemap.php`;

  return {
    statusCode: 200,
    headers: headers,
    body: body,
  };
};
