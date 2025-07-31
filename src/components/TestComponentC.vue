<template>
  <h3 class="font-medium mb-2">组件C (订阅 topic/world)</h3>
  <h3 class="font-medium mb-2">{{ componentCMQTT.id }}</h3>
  <div class="h-32 overflow-auto border p-2 rounded bg-gray-50">
    <div v-for="(msg, i) in componentCMessages" :key="i" class="text-sm mb-1">
      [{{ msg.time }}] {{ msg.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'

const componentCMessages = ref<Array<{ time: string; content: string }>>([])

const componentCMQTT = useMQTT('topic/world')
componentCMQTT.onMessage((data) => {
  componentCMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `收到消息: ${data} E`,
  })
})
</script>

<style></style>
