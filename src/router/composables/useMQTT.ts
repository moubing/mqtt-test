import type { MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { ref } from 'vue'

type Topic = string | string[]
type Option = {
  immediate: boolean
}
type Message = string | Buffer

const mqttClient = ref<MqttClient | null>(null)
const subscribedArr = ref<Set<string>>(new Set([]))
const status = ref('disconnected')
const logs = ref<string[]>([])

export const useMQTT = (url: string, option: Option | null) => {
  if (!mqttClient.value) {
    mqttClient.value = mqtt.connect(url)
  }

  const subscirbe = (topic: Topic, callback: ClientSubscribeCallback) => {
    mqttClient.value?.subscribe(topic, callback)
  }
  const onMessage = (subscirbeTopic: Topic, callback: (data: string | object) => void) => {
    mqttClient.value?.on('message', (topic, payload, packet) => {
      logs.value.push('新消息来了' + Date.now().toLocaleString() + '消息主题为：' + topic)

      if (topic === subscirbeTopic) {
        logs.value.push(
          '主题匹配，接受payload' + Date.now().toLocaleString() + '匹配主题为：' + subscirbeTopic,
        )
        logs.value.push(
          '主题匹配，解析payload' +
            Date.now().toLocaleString() +
            'payload为：' +
            payload.toString(),
        )
        callback(payload.toString())
      } else {
        logs.value.push(
          '主题不匹配，不解析payload' +
            Date.now().toLocaleString() +
            '当前主题为：' +
            topic +
            '监听主题为：' +
            subscirbeTopic,
        )
      }
    })
  }
  const unsubscribe = (topic: Topic, callback: PacketCallback) => {
    mqttClient.value?.unsubscribe(topic, callback)
  }
  const publish = (topic: string, message: Message, callback: PacketCallback) => {
    mqttClient.value?.publish(topic, message, callback)
  }

  mqttClient.value.on('connect', () => {
    logs.value.push('连接成功' + Date.now().toLocaleString())
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('reconnect', () => {
    logs.value.push('重连成功' + Date.now().toLocaleString())
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('close', () => {
    logs.value.push('连接关闭' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('end', () => {
    logs.value.push('连接结束' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('error', () => {
    logs.value.push('连接错误' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('disconnect', () => {
    logs.value.push('断开连接' + Date.now().toLocaleString())

    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  return {
    subscribedArr,
    status,
    logs,
    subscirbe,
    onMessage,
    unsubscribe,
    publish,
  }
}
