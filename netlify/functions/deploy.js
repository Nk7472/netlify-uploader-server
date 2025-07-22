const fetch = require("node-fetch");

const NETLIFY_AUTH_TOKEN = "nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800"; // Replace with your Netlify token
const SITE_NAME = `web-temp-${Date.now()}`;

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Allow": "POST" },
      body: "Method Not Allowed",
    };
  }

  try {
    const response = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: SITE_NAME }),
    });

    const siteData = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Site Created Successfully",
        siteURL: siteData.url || siteData.deploy_url,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
