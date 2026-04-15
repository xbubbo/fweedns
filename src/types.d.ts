declare module 'bun' {
    interface Env {
        PROXY: string

        AUTOADD_IP?: string
    }
}