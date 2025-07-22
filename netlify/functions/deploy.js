// netlify/functions/deploy.js
// ✅ CommonJS version for Netlify Functions

const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    const boundary = event.headers['content-type'].split('boundary=')[1];
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

    const start = bodyBuffer.indexOf(Buffer.from('PK')); // ZIP magic number
    const zipBuffer = bodyBuffer.slice(start);

    const zip = new AdmZip(zipBuffer);
    const tmpDir = path.join(os.tmpdir(), uuidv4());
    zip.extractAllTo(tmpDir, true);

    const siteName = `site-${uuidv4().slice(0, 6)}`;
    const zipOutput = path.join(os.tmpdir(), `${siteName}.zip`);

    const newZip = new AdmZip();
    newZip.addLocalFolder(tmpDir);
    newZip.writeZip(zipOutput);

    const zipData = fs.readFileSync(zipOutput);
    const deploy = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: siteName,
      })
    });

    const site = await deploy.json();

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800`,
        'Content-Type': 'application/zip'
      },
      body: zipData
    });

    const deployed = await deployRes.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ url: deployed.deploy_ssl_url || deployed.deploy_url })
    };

  } catch (err) {
    console.error('Server error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message })
    };
  }
};
