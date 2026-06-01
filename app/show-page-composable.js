import { useStore } from "@/shows.js";
import { useRoute } from "vue-router";
import { computed, onMounted } from "vue";

export function useShowPageComposable(props) {
    const store = useStore();
    const route = useRoute();

    const show = computed(() => {
        let show = props.showDetails;
        if (!show) {
            if (route.params.slug && route.params.slug[0]) {
                const slug = route.params.slug[0];
                const metas = store.showTypesBySlug[slug] || {};
                const showType = metas.type;
                show = store.showTypesByID[showType] || {};
            }
        }
        return show || {};
    });

    return {
        show,
    };
}
