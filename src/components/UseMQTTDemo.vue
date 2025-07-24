<template>
  <div class="">useMQTT</div>
  <button @click="publishHandler">publish</button>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/otherUseMQTT'

const { unsubscribe, subscribe, publish, onMessage, onMessageOnce } = useMQTT('moubing')

// subscribe()
onMessage((topic, payload) => {
  console.log(topic, 'topic')
  console.log(payload, 'payload')
})

const publishHandler = () => {
  publish('moubing', 'hello moubing')
}
</script>

<style></style>
