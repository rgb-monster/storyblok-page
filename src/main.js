import {createApp} from "vue";
import {StoryblokVue, apiPlugin} from "@storyblok/vue";
import {createWebHistory, createRouter} from "vue-router";
import App from "./App.vue";
import Page from "./components/Page.vue";
import Teaser from "./components/Teaser.vue";
import Grid from "./components/Grid.vue";
import Feature from "./components/Feature.vue";
import Words from "./components/Words.vue";
import PageView from "./PageView.vue";

const routes = [{path: "/:slug*", component: PageView}];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(StoryblokVue, {
    accessToken: import.meta.env.VITE_STORYBLOK_DELIVERY_API_TOKEN,
    apiOptions: {
        /** Set the correct region for your space. Learn more: https://www.storyblok.com/docs/packages/storyblok-js */
        region: "eu",
    },
    use: [apiPlugin],
});

app.component("Page", Page);
app.component("Teaser", Teaser);
app.component("Grid", Grid);
app.component("Feature", Feature);
app.component("Words", Words);
app.use(router).mount("#app");
