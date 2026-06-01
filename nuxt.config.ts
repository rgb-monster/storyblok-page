import mkcert from "vite-plugin-mkcert";

export default defineNuxtConfig({
    compatibilityDate: "2026-01-13",
    devtools: {enabled: false},
    modules: ["@storyblok/nuxt", "@pinia/nuxt"],

    storyblok: {
        accessToken: process.env.STORYBLOK_DELIVERY_API_TOKEN,
        apiOptions: {
            region: process.env.STORYBLOK_REGION || "eu",
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

    app: {
        head: {
            link: [
                {
                    rel: 'preload',
                    href: 'https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json',
                    as: 'fetch',
                    crossorigin: 'anonymous'
                },
                {
                    rel: 'preload',
                    href: 'https://confirmed.show/api/v1/rgb-monster/shows.json?future_shows_limit=360',
                    as: 'fetch',
                    crossorigin: 'anonymous'
                },
                {
                    href: "https://fonts.googleapis.com/icon?family=Material+Icons", 
                    rel: "stylesheet"
                }
            ],
            script: [
                {
                    innerHTML: `
window.__PRELOADED_DATA__ = {
  showTypesPromise: fetch('https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json')
    .then(r => r.ok ? r.json() : [])
    .catch(() => []),
  showsPromise: fetch('https://confirmed.show/api/v1/rgb-monster/shows.json?future_shows_limit=360')
    .then(r => r.ok ? r.json() : [])
    .catch(() => [])
};
                    `,
                },
            ],
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
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes("/app/")) {
                            return "app-bundle";
                        }
                    },
                },
            },
        },
    },
});
