import mkcert from "vite-plugin-mkcert";
import { isProduction } from "std-env";

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

    hooks: {
        async 'nitro:config'(nitroConfig) {
            // No longer needed, but keep for reference if debugging dev mode
            // if (!isProduction) {
            //     return;
            // }

            const token = process.env.STORYBLOK_DELIVERY_API_TOKEN;
            if (!token) {
                console.warn('[Prerender] STORYBLOK_DELIVERY_API_TOKEN is not set, skipping.');
                return;
            }

            const version = 'published';
            const perPage = 1000;
            let page = 1;
            let routes = [];
            
            try {
                // Fetch all links from Storyblok, paginating if necessary
                while (true) {
                    const response = await fetch(`https://api.storyblok.com/v2/cdn/links?token=${token}&version=${version}&per_page=${perPage}&page=${page}`);
                    if (!response.ok) {
                        if (response.status === 429) {
                            console.warn('[Prerender] Rate limit hit, waiting 1 second before retrying...');
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            continue;
                        }
                        throw new Error(`Failed to fetch Storyblok links (page ${page}): ${response.statusText}`);
                    }
                    const data = await response.json();
                    const links = Object.values(data.links);

                    // Stop if there are no more links to process
                    if (links.length === 0) {
                        break;
                    }

                    const newRoutes = links.map(link => link.real_path === '/home' ? '/' : link.real_path);
                    routes.push(...newRoutes);
                    
                    page++;
                    await new Promise(resolve => setTimeout(resolve, 350));
                }

                const showTypesResponse = await fetch('https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json');
                const showTypes = await showTypesResponse.json();
                const showTypesRoutes = showTypes
                    .filter(showType => showType.meta && showType.meta.slug)
                    .map(showType => `/${showType.meta.slug}`);

                const newRoutes = showTypesRoutes.filter(route => !routes.includes(route));
                routes.push(...newRoutes);
        
                // Add routes to prerender
                nitroConfig.prerender = nitroConfig.prerender || {};
                nitroConfig.prerender.routes = nitroConfig.prerender.routes || [];
                nitroConfig.prerender.routes.push(...routes);
                console.log(`[Prerender] Added ${routes.length} total routes from Storyblok to prerender:`, routes);

            } catch (e) {
                console.error('[Prerender] Error fetching Storyblok links:', e);
            }
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
});
