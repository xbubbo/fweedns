import fs from 'node:fs';
import path from 'node:path';

interface Domain {
    id: string;
    domain: string;
}

class DomainDB {
    domainFilePath: string = path.join(import.meta.dirname, 'v1', 'domains.json')

    private domains: Domain[] = [];

    constructor() {
        if (!fs.existsSync(this.domainFilePath)) fs.writeFileSync(this.domainFilePath, '[]', 'utf-8')

        this.domains = this.getDomains();
    }

    getDomains(): Domain[] {
        const data = fs.readFileSync(this.domainFilePath, 'utf-8')
        return JSON.parse(data) as Domain[]
    }

    updateDomains(domains: Domain[]): void {
        fs.writeFileSync(this.domainFilePath, JSON.stringify(domains, null, 2), 'utf-8')
    }

    getRandomDomain(): Domain | null {
        if (this.domains.length === 0) return null;
        const index = Math.floor(Math.random() * this.domains.length);
        return this.domains[index];
    }

    add(id: string, domain: string): void {
        if (this.domains.some(d => d.id === id)) return;

        this.domains.push({ id, domain });
        this.updateDomains(this.domains);
    }

    clear() {
        this.domains = [];
    }
}

const domainDB = new DomainDB();
export default domainDB;