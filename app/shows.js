import dt from "py-datetime";

import {defineStore} from "pinia";

import utils from "./utils.js";
import {Sieve} from "./sieve.js";

let _showsPromise = null;
let _showTypesPromise = null;

export const useStore = defineStore("shows", {
    state: () => {
        return {
            loaded: false,
            loading: true,
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

            return byType;
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
        showTypesBySlug: state =>
            Object.fromEntries((state.allShowTypes || []).map(showType => [showType.slug || showType.type, showType])),
    },

    actions: {
        async fetchShowTypes() {
            if (this.allShowTypes) {
                return;
            }

            if (_showTypesPromise) {
                await _showTypesPromise;
                return;
            }

            const showTypesPromise = _getPreloadedPromise("showTypesPromise");
            if (!showTypesPromise) {
                return;
            }

            _showTypesPromise = showTypesPromise
                .then(showTypes => {
                    if (typeof window !== "undefined" && window.__PRELOADED_DATA__) {
                        delete window.__PRELOADED_DATA__.showTypesPromise; // Clean up
                    }

                    showTypes = showTypes.map(showType => {
                        // flatten metas into the main record
                        let showTypeInfo = {...showType, ...showType.meta};
                        delete showTypeInfo.meta;
                        showTypeInfo.tags = (showTypeInfo.tags || []).map(tag => tag.tag);
                        showTypeInfo.slug = showTypeInfo.slug || showTypeInfo.id;
                        showTypeInfo.type = showTypeInfo.id;
                        delete showTypeInfo.id;
                        showTypeInfo.overrides = (showTypeInfo.overrides || []).map(rec =>
                            Object.fromEntries(Object.entries(rec).filter(([_field, val]) => val))
                        );
                        showTypeInfo.title = showTypeInfo.title || showTypeInfo.name;
                        delete showTypeInfo.name;
                        return showTypeInfo;
                    });

                    this.allShowTypes = showTypes;
                })
                .catch(e => {
                    this.allShowTypes = [];
                    console.error("Failed to resolve preloaded show types:", e);
                });

            await _showTypesPromise;
        },

        async fetchShows() {
            await this.fetchShowTypes();

            if (this.shows) {
                return;
            }

            if (_showsPromise) {
                await _showsPromise;
                return;
            }

            const showsPromise = _getPreloadedPromise("showsPromise");
            if (!showsPromise) {
                return;
            }

            _showsPromise = showsPromise
                .then(data => {
                    if (typeof window !== "undefined" && window.__PRELOADED_DATA__) {
                        delete window.__PRELOADED_DATA__.showsPromise; // Clean up
                    }

                    let shows = data.map(show => {
                        show = {...show};
                        show.ts = dt.datetime.strptime(show.ts, "%Y-%m-%d %H:%M:%S");
                        if (show.ts_utc) {
                            show.ts_utc = dt.datetime.strptime(show.ts_utc, "%Y-%m-%dT%H:%M:%SZ", true);
                        } else {
                            show.ts_utc = show.ts;
                        }
                        show.date = dt.datetime.combine(show.ts, dt.time());
                        if (show.ts.hour <= 5) {
                            show.date = dt.datetime(show.date - dt.timedelta({days: 1}));
                        }
                        let showMetas = _getShowMetas(this.showTypesByID[show.show_type], show);
                        show.title = showMetas.title || show.name;
                        delete show.name;
                        let acts = [...show.acts];
                        if (show.total_act_spots > acts.length) {
                            acts.push({empty: true, count: show.total_act_spots - acts.length});
                        }
                        return {...show, ...showMetas, metas: showMetas, acts};
                    });
                    shows = utils.sort(shows, rec => rec.ts);
                    this.allShows = shows;
                    this.shows = shows.filter(show => show.tickets);
                })
                .catch(e => {
                    this.shows = [];
                    console.error("Failed to resolve preloaded shows:", e);
                })
                .finally(() => {
                    this.loading = false;
                });

            await _showsPromise;
        },
    },
});

function _getPreloadedPromise(key) {
    if (typeof window !== "undefined" && window.__PRELOADED_DATA__) {
        return window.__PRELOADED_DATA__[key];
    }
    return null;
}

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
