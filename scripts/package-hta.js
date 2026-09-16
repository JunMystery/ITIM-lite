const fs = require("fs");
const path = require("path");

const distIndex = path.join(__dirname, "../dist/index.html");
const distHta = path.join(__dirname, "../dist/ITIM.hta");
const rootHta = path.join(__dirname, "../ITIM.hta");

if (fs.existsSync(distIndex)) {
  let html = fs.readFileSync(distIndex, "utf8");

  const htaHeader = `
  <meta http-equiv="x-ua-compatible" content="IE=edge" />
  <hta:application id="oITIM" applicationname="ITIM-lite" border="thin" borderstyle="normal" caption="yes" contextmenu="yes" maximizebutton="yes" minimizebutton="yes" navigable="yes" scroll="no" scrollflat="yes" selection="yes" showintaskbar="yes" singleinstance="yes" sysmenu="yes" version="2.0" windowstate="normal" />`;

  // 1. Prepare dist/ITIM.hta (relative to dist/)
  let distHtaHtml = html;
  if (distHtaHtml.indexOf("hta:application") === -1) {
    distHtaHtml = distHtaHtml.replace("<head>", "<head>" + htaHeader);
  }
  // Strip module script tags (MSHTA / IE11 only runs legacy scripts)
  distHtaHtml = distHtaHtml.replace(/<script type="module"[\s\S]*?<\/script>/gi, "");
  // Strip Safari 10 nomodule polyfill inline script
  distHtaHtml = distHtaHtml.replace(/<script[^>]*>!function\(\)\{var e=document[\s\S]*?<\/script>/gi, "");
  // Strip crossorigin attributes (avoids CORS failure on file:// protocol in MSHTA)
  distHtaHtml = distHtaHtml.replace(/\scrossorigin/gi, "");
  // Strip nomodule attributes so IE11 treats them as standard scripts
  distHtaHtml = distHtaHtml.replace(/\snomodule/gi, "");

  fs.writeFileSync(distHta, distHtaHtml, "utf8");
  console.log("Successfully packaged dist/ITIM.hta for Windows MSHTA execution.");

  // 2. Prepare root ITIM.hta (relative to project root -> references dist/assets)
  let rootHtaHtml = distHtaHtml.replace(/href="\.\/assets\//g, 'href="dist/assets/');
  rootHtaHtml = rootHtaHtml.replace(/src="\.\/assets\//g, 'src="dist/assets/');
  rootHtaHtml = rootHtaHtml.replace(/data-src="\.\/assets\//g, 'data-src="dist/assets/');

  fs.writeFileSync(rootHta, rootHtaHtml, "utf8");
  console.log("Successfully updated root ITIM.hta to launch modern compiled application.");
} else {
  console.error("dist/index.html not found. Run vite build first.");
  process.exit(1);
}
