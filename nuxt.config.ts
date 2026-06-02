import mkcert from "vite-plugin-mkcert";

// Helper function to fetch and process show type slugs
async function getShowTypeSlugs() {
    const storyblokToken = process.env.STORYBLOK_DELIVERY_API_TOKEN;
    if (!storyblokToken) {
        console.warn('[Nuxt config] STORYBLOK_DELIVERY_API_TOKEN is not set, skipping show type generation.');
        return [];
    }

    try {
        // Fetch Storyblok pages
        const storyblokResponse = await fetch(`https://api.storyblok.com/v2/cdn/links?token=${storyblokToken}&version=published`);
        if (!storyblokResponse.ok) {
            console.error(`[Nuxt config] Failed to fetch Storyblok links: ${storyblokResponse.statusText}`);
            return [];
        }
        const storyblokData = await storyblokResponse.json();
        const storyblokSlugs = new Set(Object.values(storyblokData.links).map(link => link.real_path.substring(1)));

        // Fetch show types
        const showTypesResponse = await fetch('https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json');
        if (!showTypesResponse.ok) {
            console.error(`[Nuxt config] Failed to fetch show types: ${showTypesResponse.statusText}`);
            return [];
        }
        const showTypes = await showTypesResponse.json();
        
        // Filter show types that are not in Storyblok
        const slugs = showTypes
            .map(st => st.meta.slug)
            .filter(slug => slug && !storyblokSlugs.has(slug));
        
        return slugs;
    } catch (error) {
        console.error('[Nuxt config] Error generating show type slugs:', error);
        return [];
    }
}

export default defineNuxtConfig(async () => {
    const ssgSlugs = (process.dev) ? [] : await getShowTypeSlugs();

    return {
        compatibilityDate: "2026-01-13",
        devtools: {enabled: false},
        modules: ["@storyblok/nuxt", "@pinia/nuxt"],

        runtimeConfig: {
            public: {
                showTypeSlugs: ssgSlugs,
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

        hooks: {
            async 'prerender:routes'(routes) {
                const showTypesResponse = await fetch('https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json');
                const showTypes = await showTypesResponse.json();
                const showTypesRoutes = showTypes
                    .filter(showType => showType.meta && showType.meta.slug)
                    .map(showType => `/${showType.meta.slug}`);

                showTypesRoutes.forEach(route => routes.routes.add(route));
            },
            'ready': async (nuxt) => {
                if (!process.dev) return;
                
                console.log('[Nuxt ready hook] Fetching show type slugs for dev mode...');
                const slugs = await getShowTypeSlugs();
                nuxt.options.runtimeConfig.public.showTypeSlugs = slugs;
                console.log(`[Nuxt ready hook] Found ${slugs.length} show type slugs.`);
            }
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
    }
});