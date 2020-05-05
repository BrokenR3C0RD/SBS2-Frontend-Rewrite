import * as webpack from "webpack";
import * as webpackDevServer from "webpack-dev-server";
import path from "path";
import HtmlWebPackPlugin from "html-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

const htmlPlugin = new HtmlWebPackPlugin({
    template: "./src/index.html"
});

const config: webpack.Configuration = {
    mode: "development",
    entry: "./src/index.tsx",
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    devServer: {
        contentBase: path.join(__dirname, "static"),
        historyApiFallback: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true
                        }
                    },
                    {
                        loader: 'babel-loader'
                    },
                ]
            }
        ]
    },
    plugins: [htmlPlugin, new ForkTsCheckerWebpackPlugin()]
};

export default config;