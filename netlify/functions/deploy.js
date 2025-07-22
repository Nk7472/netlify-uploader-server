// netlify/functions/deploy.js
import { Handler, HandlerEvent } from "@netlify/functions";
import JSZip from "jszip";
import fetch from "node-fetch";

const NETLIFY_TOKEN = nfp_nkaUFvvihs48EPfZocKuCxe5CZZkT6iGe800;

export const handler: Handler = async (event: HandlerEvent) => {
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
  try {
    // 1. Parse the incoming multipart body into a Zip blob
    const contentType = event.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    const raw = Buffer.from(event.body || "", "base64");
    const parts = raw
      .toString("binary")
      .split(`--${boundary}`)
      .filter(p => p.includes("site.zip"));
    if (!parts.length) throw new Error("site.zip not found in body");

    // Extract the binary zip
    const zipBase64 = parts[0].split("\r\n\r\n")[1].split("\r\n--")[0];
    const zipBuffer = Buffer.from(zipBase64, "binary");

    // 2. Load zip and prepare files map
    const zip = await JSZip.loadAsync(zipBuffer);
    const filesMap: Record<string, { content: string }> = {};

    await Promise.all(Object.keys(zip.files).map(async (name) => {
      if (zip.files[name].dir) return;
      const data = await zip.files[name].async("uint8array");
      filesMap[name] = { content: Buffer.from(data).toString("base64") };
    }));

    // 3. Create a new Netlify site
    const siteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    const site = await siteRes.json();
    if (!site.id) throw new Error("Failed to create site");

    // 4. Deploy files
    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ files: filesMap })
      }
    );
    const deploy = await deployRes.json();
    if (!deploy.deploy_ssl_url) throw new Error("Deploy failed");

    // 5. Return the live URL
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: deploy.deploy_ssl_url })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
