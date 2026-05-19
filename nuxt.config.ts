import mkcert from "vite-plugin-mkcert";

export default defineNuxtConfig({
    compatibilityDate: "2026-01-13",
    devtools: {enabled: false},
    modules: ["@storyblok/nuxt"],

    storyblok: {
        accessToken: process.env.STORYBLOK_DELIVERY_API_TOKEN,
        apiOptions: {
            /** Set the correct region for your space. Learn more: https://www.storyblok.com/docs/packages/storyblok-js#example-region-parameter */
            region: process.env.STORYBLOK_REGION || "eu",
            /** The following code is only required when creating a Storyblok space directly via the Blueprints feature. */
            endpoint: process.env.STORYBLOK_API_BASE_URL
                ? `${new URL(process.env.STORYBLOK_API_BASE_URL).origin}/v2`
                : undefined,
        },
    },

    // Global CSS/SCSS files
    css: ["../assets/destyle.css", "../assets/styles.css"],

    postcss: {
        plugins: {
            "postcss-custom-media": {
                customMedia: {
                    "--break1": "(max-width: 999px;)",
                    "--break2": "(max-width: 899px;)",
                    "--break3": "(max-width: 699px;)",
                    "--break-mob": "(max-width: 500px;)",
                },
            },
        },
    },

    ssr: true,

    devServer: {
        https: {
            key: "./.cert/dev.pem",
            cert: "./.cert/cert.pem",
        },
    },

    vite: {
        plugins: [
            mkcert({
                savePath: "./.cert",
            }),
        ],
    },
});
