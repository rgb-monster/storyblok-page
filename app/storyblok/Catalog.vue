<script>
    import dt from "py-datetime";

    import {useStore} from "@/shows.js";
    import utils from "@/utils.js";

    export default {
        props: {
            blok: Object,
        },
        data() {
            return {
                store: useStore(),
            };
        },
        computed: {
            showTypes: state => state.store.showTypesByID,

            filterIfPresent() {
                let filters = [];
                for (let field of ["from", "to", "city"]) {
                    if (this.blok[field]) {
                        filters.push(`${field.replace("city", "festival")}=${this.blok[field]}`);
                    }
                }

                return utils.isEmpty(filters) ? "" : `?${filters.join("&")}`;
            },

            shows: state => state.store.filteredShows,

            sortedShowTypes() {
                let byType = this.store.filteredShowsByType;
                let res = utils.sort(Object.values(byType), rec => rec.details.name);
                return res;
            },
        },

        mounted() {
            let blok = this.blok || {};
            this.store.setFilter({
                from: blok.date_from,
                to: blok.date_to,
                city: blok.city,
                show_types: blok.show_types,
                tickets: !blok.show_unticketed,
            });
            this.store.fetchShows();
        },
    };
</script>

<template>
    <div class="show-catalog" v-editable="blok">
        <div class="shows">
            <template v-for="{details} in sortedShowTypes" :key="details.type">
                <NuxtLink
                    class="show-type-tile"
                    :class="(details.tags || [])[0]"
                    :href="`/${details.slug}${filterIfPresent}`"
                >
                    <div class="cover-image" v-if="details.coverThumb">
                        <img :src="details.coverThumb" />
                    </div>
                    <header v-html="details.title" />

                    <div class="description">{{ details.shortDescription }}</div>

                    <div class="meta">
                        <div class="tags">
                            <div v-for="tag in details.tags.slice(0, 1)" :class="tag">{{ tag }}</div>
                        </div>
                        <div class="dates">
                            <div>
                                {{ details.dates }}
                            </div>
                        </div>
                        <div class="times">
                            <div>
                                {{ details.times.join(", ") }}
                            </div>
                        </div>
                    </div>
                </NuxtLink>
            </template>
        </div>
    </div>
</template>

<style lang="css">
    .show-catalog {
        padding: 50px;
        --grid-min-item-size: 16rem;

        .shows {
            display: grid;

            grid-template-columns: repeat(
                var(--grid-placement, auto-fill),
                minmax(var(--grid-min-item-size, 14rem), 1fr)
            );

            gap: 1em;
        }

        .show-type-tile {
            border-radius: 8px;
            background: var(--light);
            transition:
                border 300ms ease,
                box-shadow 300ms ease;

            border: 2px solid var(--shadow);
            box-shadow: 0 1px 5px var(--shadow);

            display: flex;
            flex-direction: column;
            text-align: left;
            overflow: hidden;
            width: 100%;
            font-size: 0.85em;

            --tile-padding: 25px;

            & > * {
                pointer-events: none;
            }

            &:hover {
                --shadow: var(--accent-pink);
            }

            .cover-image {
                display: flex;
                width: 100%;

                img,
                video {
                    max-width: 100%;
                    object-position: center;
                    object-fit: contain;
                }
            }

            header {
                font-size: 1.25em;
                font-weight: 600;
                padding: 25px;
                margin: 0;
                padding-bottom: 5px;
            }

            .description {
                padding: 0 var(--tile-padding);
            }

            .meta {
                padding: 0 var(--tile-padding);
                padding-bottom: var(--tile-padding);
                display: grid;
                gap: 5px;
            }

            .dates,
            .times {
                display: flex;
                align-items: center;
                gap: 5px;

                .icon {
                    font-size: 1.25em;
                }
            }

            .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding: 5px 0;

                & > div {
                    font-weight: 600;
                    color: var(--accent-pink);

                    &.kids {
                        color: var(--accent-yellow);
                    }

                    &.format {
                        color: var(--accent-green);
                    }

                    &.unique {
                        color: var(--accent-red);
                    }
                }
            }
        }
    }
</style>
