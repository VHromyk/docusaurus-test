require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService();

const SHEET_ID = process.env.REACT_APP_SHEET_ID || '';
const RANGE = `posts!A2:P${process.env.REACT_APP_ROWS_COUNT || ''}`;
const OUTPUT_DIR = path.join(__dirname, '../blog');

function fixLinks(html) {
    return html.replace(/href="\.\.\/([^"]+?)\/"/g, (_, slug) => {
        const cleanSlug = slug.toLowerCase();
        return `\nhref="/${cleanSlug}"`;
    });
}

async function fetchDataAndGeneratePages() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, 'credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: RANGE,
    });

    const rows = res.data.values;
    if (!rows || !rows.length) {
        console.log('❌ No data found');
        return;
    }

    await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });

    for (const [id, title, city, state, federal, description, slug, category, tags, keywords, icon, filters, zip, cities, states, country] of rows) {
        const content = `---
title: ${title.replace(/"/g, "'")}
description: ${title.replace(/"/g, "'")}
slug: ${slug.toLowerCase()}
tags: [${states}]
---

import PostMeta from "@site/src/components/PostMeta";

<PostMeta category="${category}" />

${turndownService.turndown(city)}

${turndownService.turndown(federal)}

${state ? `Local Regulations
------------------------
${turndownService.turndown(fixLinks(state))}` : ''}

${turndownService.turndown(description)}

Cities
-----------------------------------------
${turndownService.turndown(cities)}
`;

        const filePath = path.join(OUTPUT_DIR, `${slug.toLowerCase()}.mdx`);
        await fs.promises.writeFile(filePath, content);
    }
}

fetchDataAndGeneratePages();
