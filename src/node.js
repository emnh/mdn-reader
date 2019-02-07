const nhp = require('node-html-parser');
const parse = nhp.parse;
const fs = require('fs');
const path = require('path');
const process = require('process');

const request = require('request');
const rp = require('request-promise');
const base = 'https://developer.mozilla.org/';
const relative = '/en-US/docs/Web/API/CanvasRenderingContext2D';
const baseURL = base + relative;

const cheerio = require('cheerio');

const shell = require('shelljs');
// 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D';

// use a timeout value of 10 seconds
const timeoutInMilliseconds = 10*1000;
const opts = {
  url: baseURL,
  timeout: timeoutInMilliseconds
};

const docsDir = 'api';
const pwd = process.cwd();
const fpath = path.join(pwd, docsDir, path.basename(baseURL) + '.html');

function getFile(url) {
  console.log("getFile", url);
  return rp(
    {
      url: url,
      timeout: opts.timeout
    });
}

async function extractSyntax(fpath, body) {
  const root = cheerio.load(body);

  const syntax = root('.syntaxbox');

  const lines = syntax.text().trim().split('\n');
  const title = path.basename(fpath.replace('.html', '')) + ': ';

  lines.map(x => console.log(title, x));
  console.log('');
}

async function doParse(body) {
  const root = parse(body);

  const a = root.querySelectorAll('a');

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    const href = a[i].attributes.href;
    if (href.indexOf(relative + '/') === 0) {
      const href2 = base + href;
      if (true) {
        //console.log(href2);

        const fpath = path.join(pwd, docsDir, href2.slice(baseURL.length) + '.html');

        let body2 = '';
        if (!fs.existsSync(fpath)) {
          try  {
            const body = await getFile(href2);

            console.log("fpath", fpath);

            const fdir = path.dirname(fpath);
            shell.mkdir('-p', fdir);
            fs.writeFileSync(fpath, body);

            console.log("saved result", fpath); // body.slice(0, 10));

            body2 = body;
          } catch(err) {
            console.log("err", err);
          }
        } else {
          const body = fs.readFileSync(fpath, 'utf8');
          body2 = body;
        }

        extractSyntax(fpath, body2);
      }
      k++;
    }
  }
}

async function main() {
  if (!fs.existsSync(fpath)) {

    const body = await rp(opts);
    console.log("first");
    const fdir = path.dirname(fpath);
    shell.mkdir('-p', fdir);
    fs.writeFileSync(fpath, body);
    doParse(body);

  } else {
    const body = fs.readFileSync(fpath, 'utf8');
    await doParse(body);
  }
}

main();
