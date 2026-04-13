import fs from 'node:fs'
import path from 'node:path'

export interface Account {
    email: string
    password: string
    cookie: string
    domains: number
}

class AccountDB {
    accountFilePath: string = path.join(import.meta.dirname, 'v1', 'accounts.json')

    constructor() {
        const accountDir = path.dirname(this.accountFilePath)
        if (!fs.existsSync(accountDir)) fs.mkdirSync(accountDir, { recursive: true })
        if (!fs.existsSync(this.accountFilePath)) fs.writeFileSync(this.accountFilePath, '[]', 'utf-8')
    }

    getAccounts(): Account[] {
        const data = fs.readFileSync(this.accountFilePath, 'utf-8')
        return JSON.parse(data) as Account[]
    }

    updateAccounts(accounts: Account[]): void {
        fs.writeFileSync(this.accountFilePath, JSON.stringify(accounts, null, 2), 'utf-8')
    }

    addAccount(email: string, password: string, cookie: string): void {
        const accounts = this.getAccounts()
        accounts.push({ email, password, cookie, domains: 0 })
        this.updateAccounts(accounts)
    }

    updateCookie(email: string, cookie: string): void {
        const accounts = this.getAccounts()
        const account = accounts.find(acc => acc.email === email)
        if (account) {
            account.cookie = cookie
            this.updateAccounts(accounts)
        } else console.error(`[updateCookie] account "${email}" not found`)
    }

    incrementDomains(email: string): void {
        const accounts = this.getAccounts()
        const account = accounts.find(acc => acc.email === email)
        if (account) {
            account.domains++
            this.updateAccounts(accounts)
        } else console.error(`[incrementDomains] account "${email}" not found`)
    }

    maxOutNow(email: string) {
        const accounts = this.getAccounts()
        const account = accounts.find(acc => acc.email === email)
        if (account) {
            account.domains = 5
            this.updateAccounts(accounts)
        } else console.error(`[maxOutNow] account "${email}" not found`)
    }

    getRandomQualifiedAccount(): Account | null {
        const qualifiedAccounts = this.getAccounts().filter(acc => acc.domains < 5);
        return qualifiedAccounts[qualifiedAccounts.length * Math.random() | 0] || null;
    }

    remove(email: string): void {
        const accounts = this.getAccounts()
        const filteredAccounts = accounts.filter(acc => acc.email !== email)
        if (accounts.length === filteredAccounts.length) console.error(`[remove] account "${email}" not found`)
        else this.updateAccounts(filteredAccounts)
    }
}

const accountDB = new AccountDB()
export default accountDB