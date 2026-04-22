import accountDB, { type Account } from '../db/AccountDB';

const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;

const getRandomTimeout = () => 1000 + Math.random() * 9000; 

const checkAccount = async (account: Account, doDelete: boolean) => {
    try {
        const req = await fetch('https://freedns.afraid.org/zc.php?step=2', {
            method: 'POST',
            proxy: Bun.env.PROXY,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'username': account.email,
                'password': account.password,
                'submit': 'Login',
                'remote': '',
                'from': 'L2RvbWFpbi8=',
                'action': 'auth'
            }),
            redirect: 'manual'
        });

        if (req.headers.get('location') === 'http://freedns.afraid.org/domain/?ls=1') {
            const dnsCookie = req.headers.getSetCookie().find(e => e.startsWith('dns_cookie='));
            if (!dnsCookie) return console.log(red(`-----> missing cookie: ${account.email}`));

            const domainReq = await fetch('https://freedns.afraid.org/subdomain/', {
                headers: { cookie: dnsCookie },
                proxy: Bun.env.PROXY
            });

            const domainText = await domainReq.text();
            if (domainText.includes('<TITLE>Locked Account</TITLE>') || domainText.includes('Invalid UserID/Pass')) {
                console.log(red(`account locked: ${account.email}${doDelete ? ', deleting...' : ''}`));
                if (doDelete) accountDB.delete(account.email);
            } else if (domainText.includes('Add a subdomain') || domainText.includes('delete selected') || domainText.includes('<TITLE>Premium memberships</TITLE>')) console.log(green(`account good: ${account.email}`));
            else if (domainReq.status.toString().startsWith('5')) setTimeout(() => checkAccount(account, doDelete), getRandomTimeout());
            else console.log(domainText, account, domainReq.status);
        } else if (req.status.toString().startsWith('5')) setTimeout(() => checkAccount(account, doDelete), getRandomTimeout());
        else console.log(await req.text())
    } catch (e: any) {
        if (e.message.toString().includes('The socket connection was closed unexpectedly')) return checkAccount(account, doDelete);
        console.error('error checking account:', e);
    }
}

export default async (doDelete: boolean) => {
    const rndAccounts = accountDB.accounts.sort(() => Math.random() - 0.5);

    console.log(yellow(`checking ${rndAccounts.length} accounts (estimated to take ${Math.round(20 * rndAccounts.length) / 1000 / 60} minutes)...`));

    for (let i = 0; i < rndAccounts.length; i++) {
        const account = rndAccounts[i];
        checkAccount(account, doDelete);
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}