import http from 'node:http';
import { generatePerformanceMetrics } from '../observabilityUtil.js';

export function startDashboard(port: number): void {
    http.createServer((req, res) => {
        if (req.url === '/api/metrics' && req.method === 'GET') {
            const metrics = generatePerformanceMetrics();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metrics));
        } else if (req.url === '/' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Metrics Dashboard</title>
                </head>
                <body>
                    <h1>Loading Dashboard...</h1>
                    <script>
                        window.location.pathname = '/dashboard'
                    </script>
                </body>
                </html>
            `);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page Not Found');
        }
    }).listen(port, () => {
        console.log(`Dashboard running at http://localhost:${port}`);
    });
}
