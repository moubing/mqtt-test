<template>
  <div class="p-4 max-w-6xl mx-auto">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold mb-6">MQTT 功能测试</h1>
      <div class="flex items-center gap-2">
        <RouterLink to="/page-a" class="underline">page a</RouterLink>
        <RouterLink to="/page-b" class="underline">page b</RouterLink>
        <RouterLink to="/page-c" class="underline">page c</RouterLink>
      </div>
    </div>

    <!-- 连接状态和控制按钮 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="font-medium">连接状态:</span>
            <span :class="connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'">
              {{ connectionStatus }}
            </span>
          </div>
          <button
            @click="connectM"
            class="px-3 py-1 rounded bg-green-100 hover:bg-green-200"
            :disabled="connectionStatus === 'connected'"
          >
            连接
          </button>
          <button
            @click="disconnectM"
            class="px-3 py-1 rounded bg-red-100 hover:bg-red-200"
            :disabled="connectionStatus !== 'connected'"
          >
            断开
          </button>
        </div>
        <div class="flex items-center gap-4">
          <span class="font-medium">主题：</span>
          <input v-model="customTopic" placeholder="输入主题..." class="border p-2 rounded w-48" />
          <span class="font-medium">消息：</span>
          <input
            v-model="customMessage"
            placeholder="输入消息内容..."
            class="border p-2 rounded w-48"
          />
          <button
            @click="customPublish"
            class="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200"
          >
            发布消息
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- 主题1控制区 -->
        <div class="border p-4 rounded-lg">
          <h2 class="font-bold mb-2">主题: topic/hello</h2>
          <h2 class="font-bold mb-2">{{ id }}</h2>
          <div class="flex flex-wrap gap-2 mb-4">
          <div class="flex items-center gap-2">
            <span class="font-medium">身份:</span>
            <span class="text-sky-500">
              {{ status  }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium">leader为:</span>
            <span class="text-sky-500">
              {{  recognizedLeader }}
            </span>
          </div>
            <button @click="subscribeTest" class="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200">
              订阅
            </button>
            <button
              @click="unsubscribeTest"
              class="px-3 py-1 rounded bg-orange-100 hover:bg-orange-200"
            >
              取消订阅
            </button>
            <button
              @click="publishTest"
              class="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200"
            >
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

        <!-- 主题2控制区 -->
        <!-- <div class="border p-4 rounded-lg">
          <h2 class="font-bold mb-2">主题: topic/world</h2>
          <h2 class="font-bold mb-2">{{ anotherMQTT.id }}</h2>
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              @click="subscribeAnother"
              class="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
            >
              订阅
            </button>
            <button
              @click="unsubscribeAnother"
              class="px-3 py-1 rounded bg-orange-100 hover:bg-orange-200"
            >
              取消订阅
            </button>
            <button
              @click="publishAnother"
              class="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200"
            >
              发布消息
            </button>
          </div>
          <div class="mb-2">
            <input
              v-model="anotherMessage"
              placeholder="输入消息内容"
              class="border p-2 rounded w-full"
            />
          </div>
          <div class="h-32 overflow-auto border p-2 rounded bg-gray-50">
            <div v-for="(msg, i) in anotherMessages" :key="i" class="text-sm mb-1">
              [{{ msg.time }}] {{ msg.content }}
            </div>
          </div>
        </div> -->
      </div>
    </div>

    <!-- 多组件测试区 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="font-bold mb-4">多组件订阅测试</h2>

      <div class="flex gap-4 mb-4">
        <button @click="toggleComponentA" class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
          {{ showComponentA ? '卸载' : '挂载' }} 组件A
        </button>
        <button @click="toggleComponentB" class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
          {{ showComponentB ? '卸载' : '挂载' }} 组件B
        </button>
        <button @click="toggleComponentC" class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
          {{ showComponentC ? '卸载' : '挂载' }} 组件C
        </button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div v-if="showComponentA" class="border p-3 rounded-lg">
          <TestComponentA />
        </div>
        <div v-if="showComponentB" class="border p-3 rounded-lg">
          <TestComponentB />
        </div>
        <!-- <div v-if="showComponentC" class="border p-3 rounded-lg">
          <TestComponentC />
        </div> -->
      </div>
    </div>

    <!-- 状态监控 -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="font-bold mb-4">MQTT 状态监控</h2>
      <div class="h-96 overflow-auto">
        <ShowMQTTState />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'
import ShowMQTTState from './ShowMQTTState.vue'
import TestComponentA from './TestComponentA.vue'
import TestComponentB from './TestComponentB.vue'
// import TestComponentC from './TestComponentC.vue'

// 主连接状态




// 主题1 (topic/test) 相关逻辑
const testMessage = ref('')
const testMessages = ref<Array<{ time: string; content: string }>>([])
const customTopic = ref('')
const customMessage = ref('')

const {publish, connect, connectionStatus, disconnect,onMessage,subscribe, unsubscribe, id, status, recognizedLeader} = useMQTT('topic/hello')

const customPublish = () => {
  publish(customMessage.value, customTopic.value)
}

// 连接/断开控制
const connectM = () => {
  // 这里假设你的 useMQTT 在初始化时自动连接
  console.log('连接 MQTT')
  connect()
}

const disconnectM = () => {
  // 这里需要根据你的 useMQTT 实现添加断开逻辑
  console.log('断开 MQTT')
  disconnect()
}
onMessage((data) => {
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `收到消息: ${data} A`,
  })
})

const subscribeTest = () => {
  subscribe()
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: '已订阅 topic/hello',
  })
}

const unsubscribeTest = () => {
  unsubscribe()
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: '已取消订阅 topic/hello',
  })
}

const publishTest = () => {
  publish(testMessage.value || '测试消息 ' + new Date().toLocaleTimeString())
  testMessages.value.push({
    time: new Date().toLocaleTimeString(),
    content: `发布消息: ${testMessage.value || '测试消息'}`,
  })
  testMessage.value = ''
}

// 主题2 (topic/another) 相关逻辑
// const anotherMessage = ref('')
// const anotherMessages = ref<Array<{ time: string; content: string }>>([])

// const anotherMQTT = useMQTT('topic/world')
// anotherMQTT.onMessage((data) => {
//   anotherMessages.value.push({
//     time: new Date().toLocaleTimeString(),
//     content: `收到消息: ${data} B`,
//   })
// })

// const subscribeAnother = () => {
//   anotherMQTT.subscribe()
//   anotherMessages.value.push({
//     time: new Date().toLocaleTimeString(),
//     content: '已订阅 topic/another',
//   })
// }

// const unsubscribeAnother = () => {
//   anotherMQTT.unsubscribe()
//   anotherMessages.value.push({
//     time: new Date().toLocaleTimeString(),
//     content: '已取消订阅 topic/another',
//   })
// }

// const publishAnother = () => {
//   anotherMQTT.publish(anotherMessage.value || '另一测试消息 ' + new Date().toLocaleTimeString())
//   anotherMessages.value.push({
//     time: new Date().toLocaleTimeString(),
//     content: `发布消息: ${anotherMessage.value || '另一测试消息'}`,
//   })
//   anotherMessage.value = ''
// }

// 多组件测试
const showComponentA = ref(true)
const showComponentB = ref(true)
const showComponentC = ref(true)

const toggleComponentA = () => {
  showComponentA.value = !showComponentA.value
}

const toggleComponentB = () => {
  showComponentB.value = !showComponentB.value
}

const toggleComponentC = () => {
  showComponentC.value = !showComponentC.value
}
</script>

<style>
/* 可以添加一些自定义样式 */
</style>
