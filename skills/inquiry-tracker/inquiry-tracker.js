#!/usr/bin/env node
'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://open.assembly.go.kr/portal/openapi';
const USER_AGENT = process.env.ASSEMBLY_API_USER_AGENT || 'crewx-inquiry-tracker';
const DEFAULT_AGE = '22';

const SERVICES = {
  search: 'TVBPMBILL11',
  bill: 'ALLBILL',
  detail: 'BILLINFODETAIL',
  vote: 'ncocpgfiaoituanbr',
};

function printHelp() {
  console.log(`inquiry-tracker - National Assembly inquiry tracking helper

Usage:
  node inquiry-tracker.js <command> [args...]
  npx crewx skill inquiry-tracker <command> [args...]

Commands:
  key-guide                         Show API key issuance URLs and setup steps
  check-key                         Verify ASSEMBLY_API_KEY with a 1-row API call
  search <keyword> [--age 22]       Search bills by BILL_NAME
           [--size 20] [--json]
  bill <bill_no> [--json]           Fetch ALLBILL by public bill number
  detail <bill_id> [--json]         Fetch BILLINFODETAIL by internal BILL_ID
  vote <bill_id> [--age 22] [--json]
                                    Fetch plenary vote status by BILL_ID
  service <SERVICE> [KEY=VALUE...]  Raw wrapper for any open.assembly service
           [--json]

Examples:
  npx crewx skill inquiry-tracker key-guide
  npx crewx skill inquiry-tracker check-key
  npx crewx skill inquiry-tracker search 투표용지 --size 5
  npx crewx skill inquiry-tracker bill 2219127
  npx crewx skill inquiry-tracker detail PRC_A2A6B0Y6Z0U9T1V6W0U4S2R9Q7P0O7
  npx crewx skill inquiry-tracker vote PRC_A2A5B0Q4O0J8R1P7Y4X4W1V8T7S8M5
  npx crewx skill inquiry-tracker service nxjuyqnxadtotdrbw AGE=22 pSize=5

Notes:
  - Reads ASSEMBLY_API_KEY from the environment or a local .env file.
  - Never prints the API key.
  - Always sends a custom User-Agent; the server rejects default curl/* UA.
`);
}

function printKeyGuide() {
  console.log(`Open Assembly API key guide

1. Go to the key issuance page:
   https://open.assembly.go.kr/portal/openapi/openApiActKeyIssPage.do

2. If redirected, sign up or log in:
   https://open.assembly.go.kr/portal/user/loginPage.do

3. After login, use "마이페이지 -> 인증키 발급".
   Key history page:
   https://open.assembly.go.kr/portal/openapi/openApiActKeyPage.do

4. Store the key outside git:
   echo 'ASSEMBLY_API_KEY=your_key_here' >> .env

5. Verify:
   npx crewx skill inquiry-tracker check-key

The signup flow is a little tedious but straightforward. Keep the key out of commits;
.env should be gitignored.
`);
}

function parseArgs(argv) {
  const positionals = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      options[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = true;
    }
  }
  return { positionals, options };
}

function findEnvFiles() {
  const roots = new Set([process.cwd(), __dirname]);
  const files = [];
  for (const root of roots) {
    let current = path.resolve(root);
    for (;;) {
      files.push(path.join(current, '.env'));
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return [...new Set(files)];
}

function loadDotEnv() {
  for (const file of findEnvFiles()) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function getApiKey() {
  loadDotEnv();
  const key = process.env.ASSEMBLY_API_KEY;
  if (!key) {
    throw new Error('ASSEMBLY_API_KEY is not set. Run `npx crewx skill inquiry-tracker key-guide` for setup.');
  }
  return key;
}

function buildUrl(service, params) {
  const url = new URL(`${BASE_URL}/${service}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Non-JSON response: ${body.slice(0, 200)}`));
        }
      });
    });
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

function envelope(data, serviceHint) {
  if (data.RESULT) {
    return { service: serviceHint || 'unknown', count: undefined, result: data.RESULT, rows: [] };
  }
  const service = serviceHint || Object.keys(data)[0];
  const parts = Array.isArray(data[service]) ? data[service] : [];
  const head = parts.find((part) => part.head)?.head || [];
  const rows = parts.find((part) => part.row)?.row || [];
  const count = head.find((item) => Object.prototype.hasOwnProperty.call(item, 'list_total_count'))?.list_total_count;
  const result = head.find((item) => item.RESULT)?.RESULT || null;
  return { service, count, result, rows };
}

async function callService(service, params) {
  const key = getApiKey();
  return requestJson(buildUrl(service, {
    KEY: key,
    Type: 'json',
    pIndex: params.pIndex || 1,
    pSize: params.pSize || 20,
    ...params,
  }));
}

function compactValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return compactValue(row[key]);
    }
  }
  return '';
}

function printRows(rows, columns) {
  if (!rows.length) {
    console.log('No rows.');
    return;
  }
  rows.forEach((row, index) => {
    console.log(`\n#${index + 1}`);
    for (const [label, keys] of columns) {
      const value = pick(row, keys);
      if (value) console.log(`${label}: ${value}`);
    }
  });
}

function printEnvelopeSummary(env) {
  const code = env.result?.CODE || 'UNKNOWN';
  const message = env.result?.MESSAGE || '';
  console.log(`service: ${env.service}`);
  console.log(`result: ${code}${message ? ` (${message})` : ''}`);
  if (env.count !== undefined) console.log(`total: ${env.count}`);
  console.log(`rows: ${env.rows.length}`);
}

function printOutput(data, options, columns, serviceHint) {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const env = envelope(data, serviceHint);
  printEnvelopeSummary(env);
  printRows(env.rows, columns);
}

async function checkKey() {
  const data = await callService(SERVICES.search, { AGE: DEFAULT_AGE, pSize: 1 });
  const env = envelope(data);
  printEnvelopeSummary(env);
  if (!['INFO-000', 'INFO-200'].includes(env.result?.CODE)) {
    process.exitCode = 1;
  }
}

async function run(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }
  if (command === 'key-guide') {
    printKeyGuide();
    return;
  }
  if (command === 'check-key') {
    await checkKey();
    return;
  }

  const { positionals, options } = parseArgs(rest);
  if (command === 'search') {
    const keyword = positionals.join(' ').trim();
    if (!keyword) throw new Error('Missing keyword. Usage: search <keyword> [--age 22] [--size 20]');
    const data = await callService(SERVICES.search, {
      AGE: options.age || DEFAULT_AGE,
      pSize: options.size || 20,
      BILL_NAME: keyword,
    });
    printOutput(data, options, [
      ['bill_no', ['BILL_NO']],
      ['bill_id', ['BILL_ID']],
      ['title', ['BILL_NAME', 'BILL_NM']],
      ['proposer', ['PROPOSER', 'PPSR', 'PPSR_NM']],
      ['date', ['PROPOSE_DT', 'PPSL_DT']],
      ['committee', ['COMMITTEE', 'CURR_COMMITTEE']],
      ['status', ['PROC_RESULT', 'PROC_RESULT_CD', 'BILL_PROC_RESULT']],
    ], SERVICES.search);
    return;
  }
  if (command === 'bill') {
    const billNo = positionals[0];
    if (!billNo) throw new Error('Missing bill_no. Usage: bill <bill_no>');
    const data = await callService(SERVICES.bill, { BILL_NO: billNo, pSize: options.size || 20 });
    printOutput(data, options, [
      ['bill_no', ['BILL_NO']],
      ['bill_id', ['BILL_ID']],
      ['title', ['BILL_NAME', 'BILL_NM']],
      ['proposer', ['PROPOSER', 'PPSR', 'PPSR_NM']],
      ['date', ['PROPOSE_DT', 'PPSL_DT']],
      ['committee', ['COMMITTEE', 'CURR_COMMITTEE']],
      ['status', ['PROC_RESULT', 'BILL_PROC_RESULT', 'PROC_RESULT_CD']],
      ['link', ['LINK_URL', 'DETAIL_LINK']],
    ], SERVICES.bill);
    return;
  }
  if (command === 'detail') {
    const billId = positionals[0];
    if (!billId) throw new Error('Missing bill_id. Usage: detail <bill_id>');
    const data = await callService(SERVICES.detail, { BILL_ID: billId, pSize: options.size || 20 });
    printOutput(data, options, [
      ['bill_id', ['BILL_ID']],
      ['title', ['BILL_NAME', 'BILL_NM']],
      ['summary', ['SUMMARY', 'RST_PROPOSAL']],
      ['main_text', ['MAIN_TEXT', 'BILL_TEXT']],
      ['link', ['LINK_URL', 'DETAIL_LINK']],
    ], SERVICES.detail);
    return;
  }
  if (command === 'vote') {
    const billId = positionals[0];
    if (!billId) throw new Error('Missing bill_id. Usage: vote <bill_id> [--age 22]');
    const data = await callService(SERVICES.vote, {
      AGE: options.age || DEFAULT_AGE,
      BILL_ID: billId,
      pSize: options.size || 100,
    });
    printOutput(data, options, [
      ['bill_id', ['BILL_ID']],
      ['title', ['BILL_NAME', 'BILL_NM']],
      ['date', ['VOTE_DATE', 'PROC_DT']],
      ['result', ['RESULT', 'PROC_RESULT']],
      ['agree', ['YES_TCNT', 'AGREE', 'AGREE_TCNT']],
      ['against', ['NO_TCNT', 'DISAGREE', 'DISAGREE_TCNT']],
      ['abstain', ['BLANK_TCNT', 'ABSTAIN', 'ABSTAIN_TCNT']],
    ], SERVICES.vote);
    return;
  }
  if (command === 'service') {
    const service = positionals.shift();
    if (!service) throw new Error('Missing service code. Usage: service <SERVICE> [KEY=VALUE...] [--json]');
    const params = {};
    for (const token of positionals) {
      const eq = token.indexOf('=');
      if (eq === -1) throw new Error(`Expected KEY=VALUE parameter, got "${token}"`);
      params[token.slice(0, eq)] = token.slice(eq + 1);
    }
    if (options.size) params.pSize = options.size;
    if (options.page) params.pIndex = options.page;
    const data = await callService(service, params);
    printOutput(data, options, [
      ['bill_no', ['BILL_NO']],
      ['bill_id', ['BILL_ID']],
      ['title', ['BILL_NAME', 'BILL_NM', 'TITLE']],
      ['date', ['PROPOSE_DT', 'PPSL_DT', 'PROC_DT', 'VOTE_DATE', 'MEETING_DATE']],
      ['status', ['PROC_RESULT', 'RESULT', 'BILL_PROC_RESULT']],
    ], service);
    return;
  }

  throw new Error(`Unknown command "${command}". Run --help.`);
}

run(process.argv.slice(2)).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
