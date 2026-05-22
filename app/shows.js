import axios from "axios";
import dt from "py-datetime";

import {defineStore} from "pinia";

import utils from "./utils.js";
import {Sieve} from "./sieve.js";

export const useStore = defineStore("shows", {
    state: () => {
        return {
            loaded: false,
            loading: false,
            loadingShowTypes: false,
            allShows: [], // all shows, including those without any ticket data
            shows: null,
            allShowTypes: null, // includes archived
            sessionID: Math.round(Math.random() * 999999),
        };
    },

    getters: {
        showsSieve() {
            let shows = this.shows || [];
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

        showsByShowType() {
            // groups shows by type
            let byType = {};
            (this.shows || []).forEach(show => {
                if (!byType[show.show_type]) {
                    byType[show.show_type] = {
                        ...show.metas,
                        title: show.title,
                        emoji: show.emoji,
                        duration: show.duration,
                        description: show.public_description,
                        shows: [],
                    };
                }

                byType[show.show_type].shows.push(show);
            });

            return utils.sort(
                Object.values(byType).map(rec => ({
                    ...rec,
                    shows: utils.sort(rec.shows, show => show.ts),
                })),
                showType => showType.name
            );
        },

        showsByTag() {
            let byTag = {};
            this.shows.forEach(show => {
                show.tags.forEach(tag => {
                    utils.setDefault(byTag, tag, []).push(show);
                });
            });

            return byTag;
        },

        activeShowTypes: state => (state.allShowTypes || []).filter(showType => !showType.archived),
        showTypesByID: state =>
            Object.fromEntries((state.allShowTypes || []).map(showType => [showType.type, showType])),
    },

    actions: {
        async fetchShowTypes() {
            if (this.allShowTypes) {
                return this.allShowTypes;
            }

            if (this.loadingShowTypes) {
                // we sit here till shows have loaded, otherwise we can't fullfill the request
                while (this.loadingShowTypes) {
                    await utils.sleep(0.2);
                }
            } else {
                this.loadingShowTypes = true;

                try {
                    let metasSources = [
                        "https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json",
                        //"https://storage.googleapis.com/confirmed-static-api/rgb-presents/show-types.json",
                    ];

                    let allShowTypes = [];

                    for (let src of metasSources) {
                        const response = await fetch(`${src}?rnd=${this.sessionID}`, {
                            credentials: "omit",
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        let showTypes = await response.json();

                        showTypes = showTypes.map(showType => {
                            // flatten metas into the main record
                            let showTypeInfo = {...showType, ...showType.meta};
                            delete showTypeInfo.meta;

                            showTypeInfo.tags = (showTypeInfo.tags || []).map(tag => tag.tag);
                            showTypeInfo.slug = showTypeInfo.slug || showTypeInfo.id;

                            // we have bit of an ID confused here
                            showTypeInfo.type = showTypeInfo.id;
                            delete showTypeInfo.id;

                            showTypeInfo.overrides = (showTypeInfo.overrides || []).map(rec =>
                                // filter out empty overrides
                                Object.fromEntries(Object.entries(rec).filter(([_field, val]) => val))
                            );

                            // prefer title over the name field
                            // (title is the override while name is what we have in confirmed by default)
                            showTypeInfo.title = showTypeInfo.title || showTypeInfo.name;
                            delete showTypeInfo.name;

                            return showTypeInfo;
                        });

                        allShowTypes = [...allShowTypes, ...showTypes];
                    }

                    this.allShowTypes = allShowTypes;
                } catch (e) {
                    this.allShowTypes = [];
                    console.error(`Failed to fetch remote data: ${e.message}`);
                }

                this.loadingShowTypes = false;
            }
            return this.allShowTypes;
        },

        async fetchShows() {
            if (this.loading) {
                // we sit here till shows have loaded, otherwise we can't fullfill the request
                while (this.loading) {
                    await utils.sleep(0.2);
                }
            } else if (!this.shows) {
                this.loading = true;

                let sources = [
                    "https://confirmed.show/api/v1/rgb-monster/shows.json?future_shows_limit=360",
                    // "https://confirmed.show/api/v1/rgb-presents/shows.json",
                    // "https://confirmed.show/api/v1/bowtie/shows.json",
                ];

                await this.fetchShowTypes();

                let data = [];
                for (let source of sources) {
                    let response = await axios.get(source);
                    data = [...data, ...(response.data || [])];
                }

                this.shows = data.map(show => {
                    show.ts = dt.datetime.strptime(show.ts, "%Y-%m-%d %H:%M:%S");
                    if (show.ts_utc) {
                        show.ts_utc = dt.datetime.strptime(show.ts_utc, "%Y-%m-%dT%H:%M:%SZ", true);
                    } else {
                        show.ts_utc = show.ts; // in absence of ts_utc (meaning we don't have a timezone, use ts as tsutc)
                    }

                    show.date = dt.datetime.combine(show.ts, dt.time());

                    if (show.ts.hour <= 5) {
                        show.date = dt.datetime(show.date - dt.timedelta({days: 1}));
                    }

                    let showMetas = _getShowMetas(this.showTypesByID[show.show_type], show);

                    let ticketsURL = showMetas.tickets || "";
                    if (ticketsURL && ticketsURL.includes("tickets.edfringe.com")) {
                        // fringe has brokeneth the ability to deep-link
                        // ticketsURL = `${ticketsURL}?day=${show.date.strftime("%d-%m-%Y")}`;
                        // TODO - i could bring this brain into metas on confirmed if anyone resumes deep-linking
                        // showMetas.tickets = ticketsURL;
                    }

                    // name -> title (we have both of them and that then becomes awfully confusing)
                    // we want to use the showMetas one where available as that allows overriding act/production-facing
                    // title for cosmetic reasons
                    show.title = showMetas.title || show.name;
                    delete show.name;

                    let acts = show.acts;
                    if (show.total_act_spots > acts.length) {
                        acts.push({empty: true, count: show.total_act_spots - acts.length});
                    }

                    return {...show, ...showMetas, metas: showMetas, acts};
                });

                this.allShows = [...this.shows];

                // filter shows down to only those that we have tickets for - otherwise we have a listing that's pointing to nothing
                this.shows = this.shows.filter(show => show.tickets);
                this.loading = false;
            }

            return this.shows;
        },
    },
});

function _getShowMetas(metas, show) {
    metas = JSON.parse(JSON.stringify(metas || {}));
    let overrides = metas.overrides;
    delete metas.overrides;
    if ((overrides || []).length) {
        // find the override that matches our situation best
        let currentScore = 0;
        let matched = {};

        let mappings = {
            city: show.venue?.city,
            venue: show.venue?.name,
            time: show.ts.strftime("%H:%M"),
        };
        for (let override of overrides) {
            let matches = Object.entries(override)
                .map(([field, val]) => (mappings[field] || show[field]) == val)
                .filter(match => match);
            if (matches.length > currentScore) {
                matched = override;
                currentScore = matches.length;
            }
        }
        Object.keys(mappings).forEach(key => {
            // make sure we don't overwrite city, venue, and time with the filter stuff
            delete matched[key];
        });

        metas = {...metas, ...matched};
    }
    return metas;
}
