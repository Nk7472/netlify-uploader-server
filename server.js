// server.js

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());

const NETLIFY_TOKEN = 'nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800'; // Replace this with your actual token

app.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.folderZip) {
      return res.status(400).json({ error: 'No folder uploaded.' });
    }

    const zipFile = req.files.folderZip;
    const tempPath = path.join(__dirname, 'uploads', zipFile.name);
    await zipFile.mv(tempPath);

    // Upload to Netlify
    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const site = await response.json();

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/zip'
      },
      body: fs.createReadStream(tempPath)
    });

    const deployData = await deployResponse.json();
    fs.unlinkSync(tempPath);
    res.status(200).json({ url: deployData.deploy_ssl_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Deployment failed.' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
