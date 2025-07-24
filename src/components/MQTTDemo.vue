<template>
  <div class="h-screen w-full items-center justify-center flex">
    <div class="flex flex-col gap-2 bg-gray-50 rounded p-12">
      <div class="flex items-center justify-between border-b-2 pb-2">
        <div class="">{{ 'status:' + status }}</div>
        <div class="flex items-center gap-2">
          <button class="px-4 py-2 rounded bg-sky-200" @click="onMessageHanlder">重连</button>
          <button class="px-4 py-2 rounded bg-red-400" @click="onMessageHanlder">断开</button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <label>订阅主题</label>
        <input
          class="outline-1 outline-slate-300 outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="subscirbeTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="subscirbeHandler">订阅</button>
      </div>
      <div class="flex items-center gap-2">
        <label>监听主题</label>
        <input
          class="outline-1 outline-slate-300 outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="onMessageTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="onMessageHanlder">监听</button>
      </div>
      <div class="flex items-center gap-2">
        <label>取消订阅主题</label>
        <input
          class="outline-1 outline-slate-300 outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="unsubscribeTopic"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="unsubscribeHandler">取消订阅</button>
      </div>
      <div class="flex items-center gap-2">
        <label>发布主题</label>
        <input
          class="outline-1 outline-slate-300 outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="publishTopic"
        />
        <label for="">发布的信息</label>
        <input
          class="outline-1 outline-slate-300 outline rounded px-2 py-1"
          placeholder="请输入..."
          type="text"
          v-model="publishMessage"
        />
        <button class="px-4 py-2 rounded bg-sky-200" @click="publishHandler">发布</button>
      </div>
      <div class="grid grid-cols-2 gap-2 border-gray-300 border-t-2 pt-4">
        <div class="flex flex-col gap-2">
          <div class="text-sky-500 font-bold">状态显示</div>

          <p>
            当前订阅主题：<span class="text-pink-500">{{ subscirbeTopic }}</span>
          </p>
          <p>
            当前监听主题：<span class="text-pink-500">{{ onMessageTopic }}</span>
          </p>
          <p>
            当前取消订阅主题：<span class="text-pink-500">{{ unsubscribeTopic }}</span>
          </p>
          <p>
            当前发布主题：<span class="text-pink-500">{{ publishTopic }}</span>
          </p>
          <p>
            当前发布信息：<span class="text-pink-500">{{ publishMessage }}</span>
          </p>
        </div>
        <div class="flex flex-col gap-2">
          <div class="text-sky-500 font-bold">订阅列表</div>

          <div class="flex flex-wrap gap-2">
            <p
              v-for="(sub, index) in subscribedList"
              :key="sub"
              class="px-2 py-1 rounded text-pink-500 bg-gray-100 h-12 flex items-center justify-center"
            >
              <span class="text-stone-500 pr-2">{{ index }}</span
              >{{ sub }}
            </p>
          </div>
          <div class="text-sky-500 font-bold">监听列表</div>

          <div class="flex flex-wrap gap-2">
            <p
              v-for="(sub, index) in subscribedList"
              :key="sub"
              class="px-2 py-1 rounded text-pink-500 bg-gray-100 h-12 flex items-center justify-center"
            >
              <span class="text-stone-500 pr-2">{{ index }}</span
              >{{ sub }}
            </p>
          </div>
        </div>
      </div>
      <div class="w-[1000px] h-96 overflow-auto border-t-2 border-gray-300 p-2 flex flex-col gap-2">
        <p
          class="text-teal-400 bg-gray-100 p-3 hover:ring-2 ring-sky-300"
          v-for="(log, index) in logs"
          :key="log"
        >
          <span class="text-stone-500 w-[40px] pr-2">{{ index }}</span
          >{{ log }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMQTT } from '@/router/composables/useMQTT'
import { computed, ref } from 'vue'

const subscirbeTopic = ref('moubing')
const onMessageTopic = ref('moubing')
const unsubscribeTopic = ref('moubing')
const publishTopic = ref('moubing')
const publishMessage = ref('hello wolrd')

const { subscribedArr, status, logs, subscirbe, onMessage, unsubscribe, publish } = useMQTT(
  'ws://test.mosquitto.org:8080',
  null,
)

const subscribedList = computed(() => {
  return Array.from(subscribedArr.value)
})
const subscirbeHandler = () => {
  const currentTopic = subscirbeTopic.value
  console.log(currentTopic, 'subscribe')
  subscirbe(subscirbeTopic.value, (err) => {
    if (!err) {
      logs.value.push(
        '订阅成功' + Date.now().toLocaleString() + '订阅主题为：' + subscirbeTopic.value,
      )
      subscribedArr.value.add(currentTopic)
    } else {
      logs.value.push(
        '订阅失败' + Date.now().toLocaleString() + '订阅主题为：' + subscirbeTopic.value,
      )
    }
  })
}
const onMessageHanlder = () => {
  const currentTopic = onMessageTopic.value
  console.log(currentTopic, 'on message')

  onMessage(currentTopic, (data) => {
    logs.value.push(
      '通过回调获取到数据' +
        Date.now().toLocaleString() +
        '订阅主题为：' +
        currentTopic +
        '数据：' +
        data,
    )
  })
}
const unsubscribeHandler = () => {
  const currentTopic = unsubscribeTopic.value
  console.log(currentTopic, 'unsubscribe topic')

  unsubscribe(unsubscribeTopic.value, (err) => {
    if (!err) {
      logs.value.push(
        '取消订阅成功' + Date.now().toLocaleString() + '取消订阅主题为：' + currentTopic,
      )
      subscribedArr.value.delete(currentTopic)
    } else {
      logs.value.push(
        '取消订阅失败' + Date.now().toLocaleString() + '取消订阅主题为：' + currentTopic,
      )
    }
  })
}
const publishHandler = () => {
  const currentTopic = publishTopic.value
  const currentMessage = publishMessage.value
  console.log(currentTopic, 'publish topic')
  console.log(currentMessage, 'publish message')

  console.log('发布主题：' + publishTopic.value)
  console.log('发布信息：' + publishMessage.value)
  publish(publishTopic.value, publishMessage.value, (err) => {
    if (!err) {
      logs.value.push(
        '推送消息成功' +
          Date.now().toLocaleString() +
          '推送主题为：' +
          currentTopic +
          '推送消息为：' +
          currentMessage,
      )
    } else {
      logs.value.push(
        '推送消息失败' +
          Date.now().toLocaleString() +
          '推送主题为：' +
          currentTopic +
          '推送消息为：' +
          currentMessage,
      )
    }
  })
}
</script>

<style></style>
