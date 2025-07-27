<template>
  <h3 class="font-medium mb-2">组件B (订阅 topic/hello)</h3>
  <div class="h-32 overflow-auto border p-2 rounded bg-gray-50">
    <div v-for="(msg, i) in componentBMessages" :key="i" class="text-sm mb-1">
      [{{ msg.time }}] {{ msg.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'

const componentBMessages = ref<Array<{ time: string; content: string }>>([])

const componentBMQTT = useMQTT('topic/hello')
componentBMQTT.onMessage((data) => {
  componentBMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `收到消息: ${data} D`,
  })
})
</script>

<style></style>
