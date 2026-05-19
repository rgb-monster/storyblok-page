<script setup>
const currentYear = new Date().getFullYear();

// Fetch show types and store in global state
const {data: showTypes} = await useAsyncData("showTypes", () =>
    $fetch("https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json")
);

const showTypesState = useState("showTypes", () => showTypes.value);
</script>
<template>
	<slot></slot>
	<footer>All rights reserved © {{ currentYear }}</footer>
</template>
