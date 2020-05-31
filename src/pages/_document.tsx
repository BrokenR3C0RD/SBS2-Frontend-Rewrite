/*
 * SBS2 Frontend
 * Created on Mon May 25 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import Boundary from '../components/functional/ErrorBoundary';

class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps }
    }

    render() {
        return (
            <Boundary>
                <Html>
                    <Head />
                    <body>
                        <Boundary>
                            <Main />
                        </Boundary>
                        <script async defer data-domain="new.smilebasicsource.com" src="https://analytics.sbapi.me/js/plausible.js"></script>
                        <NextScript />
                    </body>
                </Html>
            </Boundary>
        )
    }
}

export default MyDocument