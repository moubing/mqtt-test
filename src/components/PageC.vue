<template>
  <div class="h-screen w-full flex items-center justify-center">
    <div class="max-w-[800px] p-4 bg-gray-50 rounded-lg shadow-lg border-slate-100">
      <div class="border p-4 rounded-lg">
        <h2 class="font-bold mb-2">主题: topic/world</h2>
        <div class="flex flex-wrap gap-2 mb-4">
          <button @click="subscribeTest" class="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200">
            订阅
          </button>
          <button
            @click="unsubscribeTest"
            class="px-3 py-1 rounded bg-orange-100 hover:bg-orange-200"
          >
            取消订阅
          </button>
          <button @click="publishTest" class="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200">
            发布消息
          </button>
        </div>
        <div class="mb-2">
          <input
            v-model="testMessage"
            placeholder="输入消息内容"
            class="border p-2 rounded w-full"
          />
        </div>
        <div class="h-32 overflow-auto border p-2 rounded bg-gray-50">
          <div v-for="(msg, i) in testMessages" :key="i" class="text-sm mb-1">
            [{{ msg.time }}] {{ msg.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'

const testMessage = ref('')
const testMessages = ref<Array<{ time: string; content: string }>>([])

const testMQTT = useMQTT('topic/world')
testMQTT.onMessage((data) => {
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `收到消息: ${data} pageC`,
  })
})

const subscribeTest = () => {
  testMQTT.subscribe()
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: '已订阅 topic/world pageC',
  })
}

const unsubscribeTest = () => {
  testMQTT.unsubscribe()
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: '已取消订阅 topic/world pageC',
  })
}

const publishTest = () => {
  testMQTT.publish(testMessage.value || '测试消息 ' + new Date().toLocaleTimeString())
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `发布消息: ${testMessage.value || '测试消息'} pageC`,
  })
  testMessage.value = ''
}
</script>

<style></style>
