import Enquirer from 'enquirer'
import accountDB from './db/AccountDB';
import domainDB from './db/DomainDB';

const e = new Enquirer()

const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;

e.on('cancel', () => process.exit(0))

const { action } = await e.prompt({
    type: 'select',
    name: 'action',
    message: 'whatcha wanna do?',
    choices: [
        { name: 'stats', message: 'view statistics' },
        { name: 'createAccounts', message: 'create email-verified accounts' },
        { name: 'scrapeDomains', message: 'scrapes & saves all public domains' },
        { name: 'addSubdomains', message: 'add subdomains to existing accounts' },
        { name: 'checkAccounts', message: 'checks for locked or deleted accounts' },
        { name: 'cleanupDB', message: 'cleanup accounts with no cookies' }
    ]
}) as { action: 'stats' | 'createAccounts' | 'scrapeDomains' | 'addSubdomains' | 'checkAccounts' | 'cleanupDB' }

if (action === 'stats') {
    console.log('');
    console.log(`   ${yellow('accounts:')} ${accountDB.accounts.length}`);
    console.log(`   ${yellow('domains:')} ${domainDB.getDomains().length}`);
    console.log(`   ${yellow('add space:')} ${accountDB.accounts.reduce((sum, acc) => sum + (5 - acc.domains), 0)}`);
    console.log('');
}

if (action === 'createAccounts') await import('./actions/createAccounts');
if (action === 'scrapeDomains') await import('./actions/grabDomains');

if (action === 'addSubdomains') {
    const { ip } = await e.prompt({
        type: 'input',
        name: 'ip',
        message: 'what ip you wanna point the subdomains to?',
        initial: Bun.env.AUTOADD_IP || undefined
    }) as { ip: string }

    await import('./actions/addSubdomains').then(module => module.default(ip));
}

if (action === 'checkAccounts') {
    const doDelete = await e.prompt({
        type: 'confirm',
        name: 'doDelete',
        message: 'delete accounts that are locked?',
        initial: true
    }) as { doDelete: boolean }

    await import('./actions/checkAccounts').then(module => module.default(doDelete.doDelete));
}

if (action === 'cleanupDB') accountDB.accounts.forEach((acc) => !acc.cookie && accountDB.delete(acc.email));