import type { MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { onUnmounted, ref } from 'vue'

type Option = {
  immediate: boolean
}
type Message = string | Buffer
type MessageCallback = (data: string | object) => void

const mqttClient = ref<MqttClient | null>(null)
const status = ref('disconnected')
// const onMessageCallback = ref<((t: string, payload: string | object) => void) | null>(null)
// 记录每个主题对应的消息回调函数
const topicMessageCallbackMap = ref<Map<string, Set<MessageCallback>>>(new Map([]))
// 记录每次调用useMQTT所添加的消息回调函数
const callMessageCallbackMap = ref<Map<string, Set<MessageCallback>>>(new Map())
const url = 'ws://test.mosquitto.org:8080'

export const useMQTT = (topic: string, option: Option = { immediate: true }) => {
  if (!mqttClient.value) {
    mqttClient.value = mqtt.connect(url)
  }
  console.log(option)
  const subscirbe = (callback: ClientSubscribeCallback = () => {}) => {
    mqttClient.value?.subscribe(topic, (err) => {
      if (!err) {
        console.log(`订阅成功：${topic}`)
        callback(err)
      } else {
        console.log(`订阅失败：${topic}`)
      }
    })
  }
  const onMessage = (callback: (data: string | object) => void) => {
    if (topicMessageCallbackMap.value.has(topic)) {
      topicMessageCallbackMap.value.get(topic)?.add(callback)
    } else {
      topicMessageCallbackMap.value.set(topic, new Set([callback]))
    }

    // onMessageCallback.value = (t: string, payload: string | object) => {
    //   if (topic === t) {
    //     console.log(
    //       '主题匹配，接受payload' + Date.now().toLocaleString() + '匹配主题为：' + topic,
    //     )
    //     console.log(
    //       '主题匹配，解析payload' +
    //         Date.now().toLocaleString() +
    //         'payload为：' +
    //         payload.toString(),
    //     )
    //     callback(payload.toString())
    //   } else {
    //     console.log(
    //       '主题不匹配，不解析payload' +
    //         Date.now().toLocaleString() +
    //         '当前主题为：' +
    //         t +
    //         '监听主题为：' +
    //         topic,
    //     )
    //   }
    // }
    mqttClient.value?.removeListener('message', onMessageCallback.value)
    mqttClient.value?.on('message', onMessageCallback.value)
  }
  const unsubscribe = (callback?: PacketCallback) => {
    mqttClient.value?.unsubscribe(topic, callback)
  }
  const publish = (message: Message, callback?: PacketCallback) => {
    mqttClient.value?.publish(topic, message, callback)
  }

  mqttClient.value.on('connect', () => {
    console.log('连接成功' + Date.now().toLocaleString())
    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('reconnect', () => {
    console.log('重连成功' + Date.now().toLocaleString())
    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('close', () => {
    console.log('连接关闭' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('end', () => {
    console.log('连接结束' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('error', () => {
    console.log('连接错误' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('disconnect', () => {
    console.log('断开连接' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connected ? 'connected' : 'disconnected'
  })

  onUnmounted(() => {
    unsubscribe()
  })
  return {
    status,
    subscirbe,
    onMessage,
    unsubscribe,
    publish,
  }
}
