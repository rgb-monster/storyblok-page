import {defineNuxtModule} from "@nuxt/kit";
import fs from "node:fs/promises";
import path from "node:path";

let cachedStoryblokLinks: any[] | null = null;
async function getStoryblokLinks(token: string) {
    if (cachedStoryblokLinks != null) {
        return cachedStoryblokLinks;
    }

    try {
        const storyblokResponse = await fetch(
            `https://api.storyblok.com/v2/cdn/links?token=${token}&version=published`
        );
        if (!storyblokResponse.ok) {
            console.error(`[Prerender Module] Failed to fetch Storyblok links: ${storyblokResponse.statusText}`);
            return [];
        }
        const storyblokData = await storyblokResponse.json();
        cachedStoryblokLinks = Object.values(storyblokData.links) || [];
        return cachedStoryblokLinks || [];
    } catch (error) {
        console.error("[Prerender Module] Error fetching Storyblok links:", error);
        return [];
    }
}

let cachedShowTypes: any[] | null = null;
async function getShowTypes() {
    if (cachedShowTypes !== null) {
        return cachedShowTypes;
    }

    try {
        const showTypesResponse = await fetch(
            "https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json"
        );
        if (!showTypesResponse.ok) {
            console.error(`[Prerender Module] Failed to fetch show types: ${showTypesResponse.statusText}`);
            return [];
        }
        cachedShowTypes = (await showTypesResponse.json()) || [];
        return cachedShowTypes || [];
    } catch (error) {
        console.error("[Prerender Module] Error fetching show types:", error);
        return [];
    }
}

// Process and return show type slugs filtering out ones managed in Storyblok
async function getShowTypeSlugs() {
    const storyblokToken = process.env.STORYBLOK_DELIVERY_API_TOKEN;
    if (!storyblokToken) {
        console.warn("[Prerender Module] STORYBLOK_DELIVERY_API_TOKEN is not set, skipping show type generation.");
        return [];
    }

    const links = await getStoryblokLinks(storyblokToken);
    const storyblokSlugs = new Set(links.map((link: any) => link.real_path.substring(1)));

    const showTypes = await getShowTypes();
    const slugs = showTypes
        .map((showType: any) => showType.meta?.slug || showType.id)
        .filter((slug: string) => slug && !storyblokSlugs.has(slug));

    return slugs;
}

export default defineNuxtModule({
    meta: {
        name: "prerender",
    },
    async setup(options, nuxt) {
        // Handle show type generation
        if (nuxt.options.dev) {
            const slugs = await getShowTypeSlugs();
            nuxt.options.runtimeConfig.public.showTypeSlugs = slugs;
            console.log(`[Prerender Module] Loaded ${slugs.length} show type slugs in-memory for dev mode.`);
        } else {
            const slugs = await getShowTypeSlugs();
            const filePath = path.resolve(nuxt.options.rootDir, "app/show-types-generated.json");
            await fs.writeFile(filePath, JSON.stringify(slugs, null, 2));
            console.log(`[Prerender Module] Successfully saved ${slugs.length} show type slugs to ${filePath}`);
        }

        // Handle prerendering routes
        nuxt.hook("prerender:routes", async (ctx: any) => {
            try {
                // Fetch and register show type routes
                const showTypes = await getShowTypes();
                const showTypesRoutes = showTypes.map((showType: any) => `/${showType.meta.slug || showType.id}`);

                showTypesRoutes.forEach((route: string) => ctx.routes.add(route));
                console.log(`[Prerender Module] Added ${showTypesRoutes.length} show type routes to prerender list.`);

                // Fetch and register Storyblok content page routes
                const storyblokToken = process.env.STORYBLOK_DELIVERY_API_TOKEN;
                if (storyblokToken) {
                    const links = await getStoryblokLinks(storyblokToken);
                    const storyblokRoutes = links
                        .filter((link: any) => link && !link.is_folder)
                        .map((link: any) => link.real_path)
                        .filter((route: string) => route);

                    storyblokRoutes.forEach((route: string) => {
                        let formattedRoute = route.startsWith("/") ? route : `/${route}`;
                        ctx.routes.add(formattedRoute);
                    });
                    console.log(
                        `[Prerender Module] Added ${storyblokRoutes.length} Storyblok content routes to prerender list.`
                    );
                }
            } catch (error) {
                console.error("[Prerender Module] Error adding prerender routes:", error);
            }
        });
    },
});
