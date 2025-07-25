<template>
  <div class="">
    <div class="">status:{{ status }}</div>
    <button @click="publishHandler" class="px-2 py-1 rounded bg-sky-200">publish</button>
    <button @click="unsubscribeHandler" class="px-2 py-1 rounded bg-sky-200">unsubscribe</button>
    <button @click="publishHandler1" class="px-2 py-1 rounded bg-sky-200">publish chen</button>
    <button @click="unsubscribeHandler1" class="px-2 py-1 rounded bg-sky-200">
      unsubscribe chen
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'

// import { useMQTT } from '@/router/composables/useMQTTChen'

// const { subscribe, onMessage, onMessageOnce, unsubscribe, publish } = useMQTT('moubing')
// onMessage((topic, payload) => {
//   console.log(topic, 'topic')
//   console.log(payload, 'payload')
// })

// const publishHandler = () => {
//   publish('moubing', 'hello moubing')
// }

const { onMessage, publish, status, subscirbe, unsubscribe } = useMQTT('moubing')
const chenjunhong = useMQTT('chenjunhong')
subscirbe()
onMessage((data) => {
  console.log(data, 'data1')
})
onMessage((data) => {
  console.log(data, 'data2')
})

const publishHandler = () => {
  console.log('click publish btn')
  publish('hello moubing')
}
const unsubscribeHandler = () => {
  console.log('取消订阅')
  unsubscribe()
}

chenjunhong.subscirbe()
chenjunhong.onMessage((data) => {
  console.log(`chenjunhong's ${data}`)
})

const publishHandler1 = () => {
  console.log('click chenjunhong publish btn')
  chenjunhong.publish('hello moubing')
}
const unsubscribeHandler1 = () => {
  console.log('取消订阅 chenjunhong')
  chenjunhong.unsubscribe()
}
</script>

<style></style>
