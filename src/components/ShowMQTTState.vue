<template>
  <div class="mqtt-state">
    <h2>MQTT 订阅状态</h2>
    <div v-if="topics.length === 0" class="empty-state">当前没有活跃的订阅主题。</div>
    <div v-else class="topics-list">
      <div v-for="[topic, callbacks] in topics" :key="topic" class="topic-item">
        <div class="topic-header">
          <span class="topic-name">{{ topic }}</span>
          <span class="callback-count">{{ callbacks.size }} 个回调函数</span>
        </div>
        <div v-if="callbacks.size > 0" class="callback-list">
          <div
            v-for="(callback, index) in Array.from(callbacks)"
            :key="index"
            class="callback-item"
          >
            <div class="callback-index">回调函数 #{{ index + 1 }}</div>
            <pre class="callback-code">{{ callback.toString() }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { topicMessageItemMap } from '@/router/composables/useMQTTMou'
import { computed } from 'vue'

// 将 Map 转换为数组便于渲染
const topics = computed(() => Array.from(topicMessageItemMap.value.entries()))
</script>

<style scoped>
.mqtt-state {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.empty-state {
  color: #666;
  font-style: italic;
}

.topic-item {
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
}

.topic-name {
  color: #2c3e50;
}

.callback-count {
  color: #7f8c8d;
  font-size: 0.9em;
}

.callback-list {
  margin-left: 15px;
}

.callback-item {
  margin-bottom: 10px;
}

.callback-index {
  font-weight: bold;
  color: #3498db;
  margin-bottom: 4px;
}

.callback-code {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85em;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid #ddd;
}
</style>
