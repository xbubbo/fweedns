import { parse } from 'node-html-parser';

import domainDB from '../db/DomainDB';

const getPage = async (num: number): Promise<number> => {
    try {
        const req = await fetch(`https://freedns.afraid.org/domain/registry/?page=${num}&sort=2&q=`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Host': 'freedns.afraid.org',
                'Referer': 'https://freedns.afraid.org/domain/registry/',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(10_000),
            proxy: Bun.env.PROXY.replace('SESSION', crypto.randomUUID().replaceAll('-', ''))
        });
        const res = await req.text() as string;
        const dom = parse(res);

        const rows = [
            ...dom.querySelectorAll('tr.trd'),
            ...dom.querySelectorAll('tr.trl')
        ];

        let numPublic = 0;

        rows.forEach((row) => {
            const id = row.children[0].children[0].getAttribute('href')?.split('=')[1];
            const domain = row.children[0].children[0].innerText.trim();
            const access = row.children[1].innerText.trim();

            // console.log(`found domain ${domain} with access ${access}`);

            if (access === 'public') {
                domainDB.add(id!, domain);
                numPublic++;
            }
        });

        return numPublic;
    } catch (e: any) {
        console.log('page', num, 'error:', e.message);
        return await getPage(num);
    }
}

domainDB.clear();

for (let i = 1; i <= 10; i++) {
    let totalPublic = 0;

    await Promise.all([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(async (j) => {
        const page = (i - 1) * 10 + j + 1;
        const numPublic = await getPage(page);
        console.log(`page ${page}: found ${numPublic} public domains`);
        totalPublic += numPublic;
    }));

    console.log(`finished batch ${i}`);
    if (totalPublic === 0) {
        console.log('no more public domains found, stopping');
        break;
    }
}