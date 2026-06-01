<script>
    import {useStore} from "@/shows.js";
    import {useRoute} from "vue-router";

    export default {
        props: {
            showDetails: Object,
        },
        data() {
            return {
                store: useStore(),
                route: useRoute(),
            };
        },

        computed: {
            show() {
                let show = this.showDetails;
                if (!show) {
                    let slug = this.route.params.slug[0];
                    let metas = this.store.showTypesBySlug[slug] || {};
                    let showType = metas.type;
                    show = this.store.showTypesByID[showType] || {};
                }
                return show || {};
            },
        },

        async mounted() {
            await this.store.fetchShows();
        },
    };
</script>
