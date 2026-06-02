import {defineNuxtModule} from "@nuxt/kit";
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
        const storyblokSlugs = new Set(
            Object.values(storyblokData.links).map((link: any) => link.real_path.substring(1))
        );

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
            .map((showType: any) => showType.meta?.slug || showType.id)
            .filter((slug: string) => slug && !storyblokSlugs.has(slug));

        return slugs;
    } catch (error) {
        console.error("[Nuxt config] Error generating show type slugs:", error);
        return [];
    }
}

export default defineNuxtModule({
    meta: {
        name: "show-types",
    },
    async setup(options, nuxt) {
        // Handle show type generation
        if (nuxt.options.dev) {
            const slugs = await getShowTypeSlugs();
            nuxt.options.runtimeConfig.public.showTypeSlugs = slugs;
            console.log(`[Show Types Module] Loaded ${slugs.length} show type slugs in-memory for dev mode.`);
        } else {
            const slugs = await getShowTypeSlugs();
            const filePath = path.resolve(nuxt.options.rootDir, "app/show-types-generated.json");
            await fs.writeFile(filePath, JSON.stringify(slugs, null, 2));
            console.log(`[Show Types Module] Successfully saved ${slugs.length} show type slugs to ${filePath}`);
        }

        // Handle prerendering routes
        nuxt.hook("prerender:routes", async (ctx: any) => {
            try {
                const showTypesResponse = await fetch(
                    "https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json"
                );
                if (!showTypesResponse.ok) {
                    console.error(
                        `[Show Types Module] Failed to fetch show types for prerendering: ${showTypesResponse.statusText}`
                    );
                    return;
                }
                const showTypes = await showTypesResponse.json();
                const showTypesRoutes = showTypes
                    .filter((showType: any) => showType.meta && showType.meta.slug)
                    .map((showType: any) => `/${showType.meta.slug}`);

                showTypesRoutes.forEach((route: string) => ctx.routes.add(route));
                console.log(`[Show Types Module] Added ${showTypesRoutes.length} show type routes to prerender list.`);
            } catch (error) {
                console.error("[Show Types Module] Error adding prerender routes:", error);
            }
        });
    },
});
