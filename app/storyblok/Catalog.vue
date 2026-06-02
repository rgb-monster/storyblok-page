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
            dateFrom: state => utils.parseTS((state.blok.date_from || "").split(" ")[0]),
            dateTo: state => utils.parseTS((state.blok.date_to || "").split(" ")[0]),
            city: state => state.blok.city || "",
            showTypesFilter: state => state.blok.show_types,
            showTypes: state => state.store.showTypesByID,
            shows() {
                // by default only display shows that have ticket URLs
                let shows = this.blok.show_unticketed ? this.store.shows : this.store.showsWithTickets;

                let filters = {
                    dateFrom: show => show.date >= this.dateFrom,
                    dateTo: show => show.date <= this.dateTo,
                    city: show => show.venue?.city == this.city,
                    showTypesFilter: show => this.showTypesFilter.includes(show.type),
                };

                Object.entries(filters).forEach(([field, filter]) => {
                    if (!utils.isEmpty(this[field])) {
                        shows = shows.filter(filter);
                    }
                });

                // shows = shows.filter(show =>
                return shows;
            },

            filterIfPresent: state => "",

            byShowType() {
                // all the shows matching the criteria, grouped by show type
                let res = {};
                for (let show of this.shows) {
                    let rec = utils.setDefault(res, show.type, {details: {...this.showTypes[show.type]}, shows: []});
                    rec.shows.push(show);
                }

                res = utils.sort(Object.values(res), rec => rec.details.name);

                res.forEach(({details, shows}) => {
                    details.from = dt.datetime(Math.min(shows.map(show => show.date)));
                    details.to = dt.datetime(Math.max(shows.map(show => show.date)));

                    let byDate = {};
                    shows.forEach(show => {
                        byDate[show.date.strftime("%Y-%m-%d")] = show.date;
                    });
                    let dates = utils.sort(Object.values(byDate));
                    if (dates.length < 3) {
                        details.dates = dates.map(ts => utils.humanDate(ts)).join(", ");
                    } else {
                        let [start, end] = [dates[0], dates[dates.length - 1]];
                        details.dates = `${start.strftime("%d %b")} - ${end.strftime("%d %b")}`;
                    }

                    let byTime = {};
                    shows.forEach(show => {
                        byTime[show.ts.strftime("%H:%M")] = show.ts;
                    });
                    details.times = utils.sort(Object.values(byTime), ts => ts.time()).map(ts => ts.strftime("%H:%M"));
                });
                return res;
            },
        },

        mounted() {
            this.store.fetchShows();
        },
    };
</script>

<template>
    <div class="show-catalog" v-editable="blok">
        <div class="shows">
            <template v-for="{details, shows} in byShowType" :key="details.type">
                <NuxtLink class="show-type-tile" :class="(details.tags || [])[0]" :href="`/${details.slug}${filterIfPresent}`">
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
                            <Icon name="calendar_month" />
                            <div>
                                {{ details.dates }}
                            </div>
                        </div>
                        <div class="times">
                            <Icon name="schedule" />
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

        .shows {
            display: flex;
            flex-wrap: wrap;
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
            width: 300px;
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
