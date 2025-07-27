<template>
  <h3 class="font-medium mb-2">组件A (订阅 topic/hello)</h3>
  <div class="h-32 overflow-auto border p-2 rounded bg-gray-50">
    <div v-for="(msg, i) in componentAMessages" :key="i" class="text-sm mb-1">
      [{{ msg.time }}] {{ msg.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'

const componentAMessages = ref<Array<{ time: string; content: string }>>([])

const componentAMQTT = useMQTT('topic/hello')
componentAMQTT.onMessage((data) => {
  componentAMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `收到消息: ${data} C`,
  })
})
</script>

<style></style>
