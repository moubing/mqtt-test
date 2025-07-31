<template>
  <div class="h-screen w-full flex items-center justify-center">
    <div class="max-w-[800px] p-4 bg-gray-50 rounded-lg shadow-lg border-slate-100">
      <div class="flex items-center gap-4">
        <span class="font-medium">主题：</span>
        <input v-model="customTopic" placeholder="输入主题..." class="border p-2 rounded w-48" />
        <span class="font-medium">消息：</span>
        <input
          v-model="customMessage"
          placeholder="输入消息内容..."
          class="border p-2 rounded w-48"
        />
        <button @click="customPublish" class="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200">
          发布消息
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { testSchema } from '@/router/composables/useAntdFormZod'
import { useMQTT } from '@/router/composables/useMQTTMou'
import { ref } from 'vue'

const { publish } = useMQTT('some')

const customTopic = ref('')
const customMessage = ref('')

const customPublish = () => {
  publish(customMessage.value, customTopic.value)
}

console.log(testSchema, 'test')
</script>

<style></style>
