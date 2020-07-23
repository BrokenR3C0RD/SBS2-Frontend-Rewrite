declare global {
    export interface Parse {
        parseLang(code: string, lang: string, preview?: boolean): HTMLElement
    }
}