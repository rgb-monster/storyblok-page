import mkcert from "vite-plugin-mkcert";
import fs from "node:fs/promises";
import path from "node:path";

// Helper function to fetch and process show type slugs
async function getShowTypeSlugs() {
    const storyblokToken = process.env.STORYBLOK_DELIVERY_API_TOKEN;
    if (!storyblokToken) {
        console.warn("[Nuxt config] STORYBLOK_DELIVERY_API_TOKEN is not set, skipping show type generation.");
        return [];
    }

    try {
        // Fetch Storyblok pages
        const storyblokResponse = await fetch(
            `https://api.storyblok.com/v2/cdn/links?token=${storyblokToken}&version=published`
        );
        if (!storyblokResponse.ok) {
            console.error(`[Nuxt config] Failed to fetch Storyblok links: ${storyblokResponse.statusText}`);
            return [];
        }
        const storyblokData = await storyblokResponse.json();
        const storyblokSlugs = new Set(Object.values(storyblokData.links).map(link => link.real_path.substring(1)));

        // Fetch show types
        const showTypesResponse = await fetch(
            "https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json"
        );
        if (!showTypesResponse.ok) {
            console.error(`[Nuxt config] Failed to fetch show types: ${showTypesResponse.statusText}`);
            return [];
        }
        const showTypes = await showTypesResponse.json();

        // Filter show types that are not in Storyblok
        const slugs = showTypes
            .map(showType => showType.meta?.slug || showType.id)
            .filter(slug => slug && !storyblokSlugs.has(slug));

        return slugs;
    } catch (error) {
        console.error("[Nuxt config] Error generating show type slugs:", error);
        return [];
    }
}

export default defineNuxtConfig({
    compatibilityDate: "2026-01-13",
    devtools: {enabled: false},
    modules: [
        // Inline module to dynamically handle show type generation
        async (inlineOptions, nuxt) => {
            if (nuxt.options.dev) {
                console.log('[Show Types Module] Fetching show type slugs for dev (in-memory)...');
                const slugs = await getShowTypeSlugs();
                nuxt.options.runtimeConfig.public.showTypeSlugs = slugs;
                console.log(`[Show Types Module] Loaded ${slugs.length} show type slugs in-memory for dev mode.`);
            } else {
                console.log('[Show Types Module] Generating show type slugs for production...');
                const slugs = await getShowTypeSlugs();
                const filePath = path.resolve(nuxt.options.rootDir, 'app/show-types-generated.json');
                await fs.writeFile(filePath, JSON.stringify(slugs, null, 2));
                console.log(`[Show Types Module] Successfully saved ${slugs.length} show type slugs to ${filePath}`);
            }
        },
        "@storyblok/nuxt", 
        "@pinia/nuxt"
    ],

    runtimeConfig: {
        public: {
            // Only populated dynamically in dev mode via the inline module
            showTypeSlugs: [],
        },
    },

    hooks: {
        async 'prerender:routes'(routes) {
            const showTypesResponse = await fetch('https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json');
            const showTypes = await showTypesResponse.json();
            const showTypesRoutes = showTypes
                .filter(showType => showType.meta && showType.meta.slug)
                .map(showType => `/${showType.meta.slug}`);

            showTypesRoutes.forEach(route => routes.routes.add(route));
        }
    },

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
