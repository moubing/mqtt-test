import type { MqttClient } from 'mqtt'
import mqtt, { type ClientSubscribeCallback, type OnMessageCallback } from 'mqtt'
import { ref } from 'vue'

type Topic = string | string[]
type Option = {
  immediate: boolean
}
type Message = string | Buffer

const mqttClient = ref<MqttClient | null>(null)

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
  return {
    subscirbe,
    onMessage,
    unsubscribe,
    publish,
  }
}
