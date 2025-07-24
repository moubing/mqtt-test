import type { MqttClient } from 'mqtt'
import mqtt, { type ClientSubscribeCallback, type OnMessageCallback } from 'mqtt'
import { ref } from 'vue'

type Topic = string | string[]
type Option = {
  immediate: boolean
}
type Message = string | Buffer

const mqttClient = ref<MqttClient | null>(null)
const status = ref('disconnected')

export const useMQTT = (url: string, option: Option | null) => {
  if (!mqttClient.value) {
    mqttClient.value = mqtt.connect(url)
  }
  console.log(option, 'option')

  const subscirbe = (topic: Topic, callback: ClientSubscribeCallback) => {
    mqttClient.value?.subscribe(topic, callback)
  }
  const onMessage = (callback: OnMessageCallback) => {
    mqttClient.value?.on('message', callback)
  }
  const unsubscribe = (topic: Topic) => {
    mqttClient.value?.unsubscribe(topic)
  }
  const publish = (topic: string, message: Message) => [mqttClient.value?.publish(topic, message)]

  mqttClient.value.on('connect', () => {
    console.log('connect')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('reconnect', () => {
    console.log('reconnect')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('close', () => {
    console.log('close')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('end', () => {
    console.log('end')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('error', () => {
    console.log('error')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  mqttClient.value.on('disconnect', () => {
    console.log('disconnect')
    status.value = mqttClient.value?.connect ? 'connected' : 'disconnected'
  })
  return {
    status,
    subscirbe,
    onMessage,
    unsubscribe,
    publish,
  }
}
