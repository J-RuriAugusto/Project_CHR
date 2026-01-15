/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { webpack }) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.versions': JSON.stringify({}),
            })
        );
        return config;
    },
};

module.exports = nextConfig;
