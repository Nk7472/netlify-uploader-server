const fetch = require("node-fetch");

const NETLIFY_AUTH_TOKEN = "nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800"; // Replace this with your token
const SITE_NAME = `uploaded-site-${Date.now()}`; // Optional: custom site name

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
    // Create a new blank site
    const createSiteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: SITE_NAME })
    });

    const siteData = await createSiteResponse.json();

    // Return the URL of the site
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Uploaded Successfully",
        siteURL: siteData.url || siteData.deploy_url,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
