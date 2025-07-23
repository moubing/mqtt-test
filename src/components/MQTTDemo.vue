<template>
  <div class="h-screen w-full items-center justify-center flex">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <label>订阅主题</label>
        <input
          class="outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="subscirbeTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="subscirbeHandler">订阅</button>
      </div>
      <div class="flex items-center gap-2">
        <label>监听主题</label>
        <input
          class="outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="onMessageTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="onMessageHanlder">监听</button>
      </div>
      <div class="flex items-center gap-2">
        <label>取消订阅主题</label>
        <input
          class="outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="unsubscribeTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="unsubscribeHandler">取消订阅</button>
      </div>
      <div class="flex items-center gap-2">
        <label>发布主题</label>
        <input
          class="outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="publishTopic"
        />
        <label for="">发布的信息</label>
        <input
          class="outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="publishMessage"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="publishHandler">发布</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTT'
import { ref } from 'vue'

const subscirbeTopic = ref('moubing')
const onMessageTopic = ref('moubing')
const unsubscribeTopic = ref('moubing')
const publishTopic = ref('moubing')
const publishMessage = ref('hello wolrd')

const { subscirbe, onMessage, unsubscribe, publish } = useMQTT('ws://test.mosquitto.org:8080', null)
const subscirbeHandler = () => {
  subscirbe(subscirbeTopic.value, (err) => {
    if (!err) {
      console.log('订阅成功')
    } else {
      console.log('订阅失败')
    }
  })
}
const onMessageHanlder = () => {
  console.log('监听成功')
  onMessage((topic, payload, packet) => {
    console.log('on message, topic is:' + topic)
    console.log(packet, 'packet')
    if (topic === subscirbeTopic.value) {
      console.log('主题匹配，接受payload')
      console.log(payload.toString(), 'payload')
    } else {
      console.log('主题不匹配')
    }
  })
}
const unsubscribeHandler = () => {
  console.log('取消订阅：' + unsubscribeTopic.value)
  unsubscribe(unsubscribeTopic.value)
}
const publishHandler = () => {
  console.log('发布主题：' + publishTopic.value)
  console.log('发布信息：' + publishMessage.value)
  publish(publishTopic.value, publishMessage.value)
}
</script>

<style></style>
