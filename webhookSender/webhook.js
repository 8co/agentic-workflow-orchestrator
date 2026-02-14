import http from 'node:http';
import https from 'node:https';

interface WebhookPayload {
  [key: string]: unknown;
}

function constructRequestPayload(data: WebhookPayload): string {
  return JSON.stringify(data);
}

function sendNotification(url: string, payload: WebhookPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const urlObject = new URL(url);
      const options: http.RequestOptions | https.RequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
        },
      };

      const requestFunc = urlObject.protocol === 'https:' ? https.request : http.request;
      const req = requestFunc(urlObject, options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Failed with status code: ${res.statusCode}`));
        }
      });

      req.on('error', (e) => {
        reject(new Error(`Request error: ${e.message}`));
      });

      req.write(JSON.stringify(payload));
      req.end();
    } catch (error) {
      reject(new Error(`Error while sending notification: ${error}`));
    }
  });
}

export { constructRequestPayload, sendNotification };
