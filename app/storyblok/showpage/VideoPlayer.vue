<script>
    import { useShowPageComposable } from "@/show-page-composable.js";
    import { ref } from "vue";

    export default {
        props: {
            showDetails: Object,
        },
        setup(props) {
            const { show } = useShowPageComposable(props);

            const videoPlaying = ref(false);
            const video = ref(null);

            const togglePlayback = () => {
                if (video.value.paused) {
                    video.value.play();
                } else {
                    video.value.pause();
                }
            };

            return { show, videoPlaying, video, togglePlayback };
        },
    };
</script>

<template>
    <section class="show-page-video" v-if="show.squareVideo">
        <main>
            <button class="player" :class="{playing: videoPlaying}" @click="togglePlayback">
                <video playsinline ref="video" @play="videoPlaying = true" @pause="videoPlaying = false">
                    <source :src="show.squareVideo" type="video/mp4" />
                </video>
                <div class="play-controls">
                    <div class="play-icon"><Icon name="play_arrow" /></div>
                </div>
            </button>
        </main>
    </section>
</template>

<style lang="css">
    .show-page-video {
        .player {
            position: relative;
            cursor: pointer;

            --button-size: min(60px, 15vw);
        }

        .play-controls {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .play-icon {
            height: var(--button-size);
            width: var(--button-size);
            border-radius: 50%;
            background: var(--accent-pink);
            display: flex;
            justify-content: center;
            align-items: center;
            outline: min(10px, 2.5vw) solid #fff;
            opacity: 1;
            transition: opacity 300ms ease;
        }

        .play-icon .icon {
            font-size: calc(var(--button-size) * 0.8);
            color: #fff;
        }

        .player.playing .play-icon {
            opacity: 0;
        }

        video {
            border-radius: 15px;
            outline: min(10px, 2.5vw) solid var(--accent-pink);
            z-index: 0;
            position: relative;
        }
    }
</style>
