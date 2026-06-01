<script>
    import dt from "py-datetime";

    import utils from "@/utils.js";
    import {Sieve} from "@/sieve.js";
    import {useStore} from "@/shows.js";
    import {useRoute} from "vue-router";

    export default {
        props: {
            blok: Object,
        },
        data() {
            return {
                store: useStore(),
                route: useRoute(),
                headerObserver: null,
                scrollY: 0,
                now: dt.datetime.now(),
            };
        },

        computed: {
            standard: state => [undefined, true].includes(state.blok.standard_structure),
            slug: state => state.route.params.slug[0], // we shall assume /shows/<showtype> structure
            theme: state => state.blok.colour || "beige",
            curtains: state => !state.blok.hide_curtains,
            loading: state => state.store.loading,

            pushAway() {
                let factor = this.scrollY * 0.02;
                let px = Math.max(-Math.pow(factor, 2), -300);
                return px;
            },

            metas: state => state.store.showTypesBySlug[state.slug] || {},
            showDescription() {
                let description = this.metas.description || "";
                description = description.replace(/\n/g, "<br />");
                return description;
            },

            showDetails: state => (state.metas?.type ? state.store.showsByShowType[state.metas?.type] || {} : {}),

            showsSieve() {
                let shows = this.showDetails.shows || [];
                let serialized = shows.map(show => {
                    return {
                        id: show.id,
                        city: show.venue.city,
                        venue: show.venue.name,
                        acts: show.acts.map(act => act.name),
                        ts: show.ts.strftime("%A %B %d %Y %H:%M").split(" "),
                        ts_str: show.ts.strftime("%A %b %d %Y %H:%M"),
                    };
                });
                return new Sieve(serialized);
            },
            shows() {
                let shows = this.showDetails.shows || [];

                // node nonsense (window is not defined when generating pages)
                let windowHandle;
                try {
                    windowHandle = window;
                } catch (error) {
                    // pass
                }

                if (windowHandle && windowHandle.location.search) {
                    let filter = new URLSearchParams(windowHandle.location.search).get("festival");
                    if (filter) {
                        let ids = this.showsSieve.filter(filter);
                        shows = shows.filter(show => ids.includes(show.id));
                    }
                }

                return shows;
            },
            topShow: state => state.shows[0],

            dates() {
                let byDate = {};
                this.shows.forEach(show => {
                    byDate[show.ts.strftime("%Y-%m-%d")] = show.ts;
                });

                let dates = utils.sort(Object.values(byDate));
                if (dates.length < 3) {
                    return dates.map(ts => utils.humanDate(ts)).join(", ");
                } else {
                    let [start, end] = [dates[0], dates[dates.length - 1]];
                    return `${utils.humanDate(start)}-${utils.humanDate(end)}`;
                }
            },

            upcomingShows() {
                return this.shows.filter(show => show.ts > this.now);
            },

            showsByDate() {
                let byDate = {};
                this.upcomingShows.forEach(show => {
                    utils
                        .setDefault(byDate, show.date.strftime("%Y-%m-%d"), {date: show.date, ts: show.ts, shows: []})
                        .shows.push(show);
                });

                return utils.sort(Object.values(byDate), date => date.date);
            },
        },

        methods: {
            updateScrollPos(evt) {
                this.scrollY = window.scrollY;
            },
        },

        async mounted() {
            this.headerObserver = new IntersectionObserver(
                ([evt]) => {
                    if (this.$refs.header) {
                        this.$refs.header.classList.toggle("pinned", evt.intersectionRatio < 1);
                    }
                },
                {threshold: 1}
            );
            await this.store.fetchShows();
            this.loaded = true;

            await this.$nextTick();

            if (this.standard) {
                this.headerObserver.observe(this.$refs.metaHeader);
            }

            document.addEventListener("scroll", this.updateScrollPos);

            if (document.location.hash) {
                let elem = document.getElementById(document.location.hash.slice(1));
                if (elem) {
                    elem.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"});
                }
            }
        },
    };
</script>

<template>
    <main v-editable="blok" class="show-page" :class="theme">
        <template v-if="curtains">
            <img class="curtains-left" src="/curtains-left.webp" :class="{hidden: pushAway < -5}" />
            <img class="curtains-right" src="/curtains-right.webp" :class="{hidden: pushAway < -5}" />
        </template>

        <div class="sticky-header" ref="header">
            <div class="contents">
                <img class="square-logo" v-if="metas.square" :src="metas.square" />
                <h1 v-html="metas.title" />
            </div>
        </div>

        <template v-if="standard">
            <template v-if="!loading">
                <component is="showpage-banner" :show-details="showDetails" />

                <section class="title" ref="metaHeader">
                    <main>
                        <div class="partnership" v-if="metas.partnership">
                            Presented in partnership with <mark>{{ metas.partnership }}</mark>
                        </div>
                        <h1 v-html="metas.title" />
                    </main>
                </section>

                <section class="meta">
                    <main>
                        <div class="location" :class="{'not-ready': loading || !topShow}">
                            <div>
                                <Icon name="calendar_month" />
                                <div v-if="!loading">{{ dates }}</div>
                            </div>

                            <!-- <div>
                            <Icon name="location_on" />
                            <div v-if="!loading">{{ topShow?.venue?.name }}</div>
                        </div>

                        <div>
                            <Icon name="schedule" />
                            <div v-if="!loading">{{ topShow?.ts?.strftime("%H:%M") }}</div>
                        </div> -->
                        </div>

                        <div class="tags">
                            <div v-for="(tag, idx) in metas.tags" :key="idx" :class="tag.tag">{{ tag.tag }}</div>
                        </div>
                    </main>
                </section>

                <section class="cta">
                    <main :class="{'not-ready': loading || !topShow}">
                        <button @click="jumpToDates()" v-if="loading || upcomingShows.length > 1">
                            <div class="button-inner">
                                <template v-if="!metas.cta">
                                    <Icon name="local_activity" />
                                    {{ metas.payment == "unticketed" ? "See Dates" : "Get tickets" }}
                                </template>
                                <template v-else>
                                    {{ metas.cta }}
                                </template>
                            </div>
                        </button>

                        <a :href="topShow?.tickets" target="blank" v-else>
                            <div class="button-inner">
                                <template v-if="!metas.cta">
                                    <Icon name="local_activity" />
                                    {{ metas.payment == "unticketed" ? "See Dates" : "Get tickets" }}
                                </template>
                                <template v-else>
                                    {{ metas.cta }}
                                </template>
                            </div>
                        </a>
                    </main>
                </section>

                <section class="show-description">
                    <main v-html="showDescription" />
                </section>

                <component is="showpage-video-player" />

                <section class="social-proof" v-if="metas.quotes">
                    <main>
                        <component is="showpage-quotes-carousel" :quotes="metas.quotes" />
                    </main>
                </section>

                <template v-if="!loading && upcomingShows.length > 1">
                    <component is="showpage-about-tickets" />

                    <section class="dates" ref="dates">
                        <main>
                            <h2>Upcoming Shows</h2>

                            <component is="showpage-shows" :showsByDate="showsByDate" :metas="metas" />
                        </main>
                    </section>
                </template>
            </template>
        </template>

        <StoryblokComponent v-for="currentBlok in blok.body" :key="currentBlok._uid" :blok="currentBlok" />
    </main>
</template>

<style lang="css">
    .show-page {
        padding-bottom: 3em;
        margin: 0 auto;
        --square-size: 60px;
        --within-curtains: min(1000px, 55vw);

        .cover {
            transition: all 300ms;
            overflow: hidden;
            border-radius: 0;
        }

        .doodle-mic-left {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .curtains-left,
        .curtains-right {
            position: fixed;
            top: 0;
            z-index: 2000;
            pointer-events: none;
            width: min(400px, 19.5vw);
            transition:
                left 500ms ease,
                right 500ms ease;
        }

        .curtains-left {
            left: 0;
            &.hidden {
                left: -500px;
            }
        }

        .curtains-right {
            right: 0;
            &.hidden {
                right: -500px;
            }
        }

        .sticky-header {
            position: fixed;
            z-index: 500;
            width: 100%;
            box-shadow: 0px 2px 5px #aaa;
            background: var(--chrome);
            color: var(--chrome-text);

            top: -100px;

            transition: top 300ms ease;

            display: grid;
            grid-template-columns: auto 1fr;

            .site-dropdown {
                .toggle {
                    padding: var(--content-horiz-padding);
                }
            }

            &.pinned {
                top: 0;
            }

            .contents {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                padding: 10px var(--content-horiz-padding);
            }

            h1 {
                color: #fff;
                font-size: min(6vw, 2em);
                margin-top: 4px; /* manually pushed the header down for visual vertical alignment */
            }

            .square-logo {
                min-width: var(--square-size);
                min-height: var(--square-size);
                max-width: var(--square-size);
                max-height: var(--square-size);
                border-radius: 10px;
            }
        }

        main {
            text-align: center;
        }

        section.title {
            text-align: center;
            main {
                max-width: var(--within-curtains);
                padding-bottom: 0;
            }

            h1 {
                line-height: 100%;
                margin-bottom: 0;
            }

            .partnership {
                font-weight: 600;
                color: var(--label);
                margin-bottom: 10px;

                mark {
                    background: none;
                    color: inherit;
                }
            }
        }

        section.meta {
            padding-top: 0;

            main {
                padding-bottom: 0;
            }

            .location {
                font-family: var(--rgb-font);
                color: #999;
                font-size: 1.25em;
                font-weight: 400;
                margin-top: 1em;

                display: flex;
                flex-wrap: wrap;

                align-items: center;
                gap: 0.5em;
                justify-content: center;

                opacity: 1;
                transition: opacity 300ms ease;

                &.not-ready {
                    opacity: 0;
                }

                & > div {
                    display: flex;
                    align-items: end;
                    gap: 5px;
                }

                .icon {
                    font-size: 1.25em;
                    display: flex;
                }
            }

            .tags {
                font-family: var(--rgb-font);
                color: var(--accent-pink);
                font-size: 1.25em;
                font-weight: 400;
                margin-top: 1em;

                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;

                .kids {
                    color: var(--accent-yellow);
                }

                .format {
                    color: var(--accent-green);
                }

                .unique {
                    color: var(--accent-red);
                }
            }
        }

        section.cta {
            background: var(--base);
            padding: 2em;
            opacity: 1;
            transition: opacity 500ms ease;

            .contents.not-ready {
                opacity: 0;
            }

            .button-inner {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px 30px;
                border-radius: 10px;
            }

            button,
            a {
                background: var(--accent-burgundy);
                font-size: min(1.25em, 5vw);
                border-radius: 15px;
                font-weight: 600;
                color: var(--accent-burgundy);

                display: inline-block;

                padding: 6px;

                box-shadow: 0px 6px #b28b8d;

                background: #fff;
                border: 5px solid var(--accent-burgundy);

                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.1em;
                margin-bottom: 3px;

                .icon {
                    font-size: 2em;
                    font-size: min(2em, 10vw);
                }

                &:active {
                    box-shadow: none;
                    margin-top: 3px;
                    margin-bottom: 0;
                }
            }
        }

        section.show-description {
            line-height: 1.8;
            font-size: 1.25em;
        }

        p {
            line-height: 180%;
            font-size: 1.25em;
        }

        @media (min-width: 1000px) {
            .doodle-mic-left {
                opacity: 1;
                left: 0;
                top: 100px;
                width: 150px;
            }
        }

        @media (min-width: 800px) {
            .cover {
                border-radius: 15px;
            }
        }

        @media (max-width: 800px) {
            section.banner {
                padding: 0;

                .contents {
                    padding: 0;
                }
            }

            .doodle-mic-left {
                opacity: 1;
                left: 0;
                top: 50vw;
                width: 70px;
            }
        }

        @media (max-width: 600px) {
            --square-size: 14vw;

            section.meta {
                .location {
                    display: grid;
                    justify-items: center;
                    font-size: 1em;
                    gap: 0.25em;

                    & > div {
                        gap: 2px;
                    }
                }

                .tags {
                    font-size: 1em;
                }
            }
        }
    }
</style>
