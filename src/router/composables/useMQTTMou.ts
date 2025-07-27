import type { IClientSubscribeOptions, MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { onUnmounted, ref } from 'vue'

type Option = IClientSubscribeOptions & {
  immediate: boolean
}
type Message = string | Buffer
type MessageCallback = (data: string | object) => void

// 全局单例 MQTT 客户端
let mqttClient: MqttClient | null = null
// const topicMessageCallbackMap: Map<string, Set<MessageCallback>> = new Map()
const status = ref('disconnected')
const url = 'ws://test.mosquitto.org:8080'
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

export const topicMessageCallbackMap = ref<Map<string, Set<MessageCallback>>>(new Map())

// 初始化 MQTT 客户端并绑定全局事件
const initMQTTClient = () => {
  if (!mqttClient) {
    mqttClient = mqtt.connect(url, {
      reconnectPeriod: 0, // 禁用自动重连
      clean: true, // 清除会话
    })

    // 全局事件只需绑定一次
    mqttClient.on('connect', () => {
      console.log('连接成功', Date.now().toLocaleString())
      status.value = 'connected'
      reconnectAttempts = 0
    })

    mqttClient.on('reconnect', () => {
      console.log('重连成功', Date.now().toLocaleString())
      status.value = 'connected'
    })

    mqttClient.on('close', () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('重连次数超限，请检查网络')
        return
      }
      console.log('连接关闭', Date.now().toLocaleString())
      status.value = 'disconnected'
      const delay = 1000 * Math.pow(2, reconnectAttempts)
      setTimeout(() => mqttClient?.reconnect(), delay)
      reconnectAttempts++
    })

    mqttClient.on('error', (err) => {
      console.error('连接错误', err)
      status.value = 'disconnected'
    })

    mqttClient.on('message', (t: string, payload: Buffer) => {
      const callbacks = topicMessageCallbackMap.value.get(t)
      if (callbacks) {
        const payloadStr = payload.toString()
        console.log(`收到消息 [${t}]:`, payloadStr)
        callbacks.forEach((cb) => cb(payloadStr))
      }
    })
  }
}

export const useMQTT = (topic: string, option: Option = { immediate: true, qos: 0 }) => {
  if (!topic) throw new Error('使用useMQTT的第一个参数（主题）不能为空字符串')
  initMQTTClient() // 确保客户端初始化
  let messageCallback: MessageCallback | undefined = undefined

  const subscribe = (callback: ClientSubscribeCallback = () => {}) => {
    mqttClient?.subscribe(topic, { qos: option.qos || 0 }, (err) => {
      if (err) {
        console.error(`订阅失败 [${topic}]:`, err)
        callback(err)
      } else {
        console.log(`订阅成功 [${topic}]`)
        callback(err)
      }
    })
  }

  const onMessage = (callback: MessageCallback) => {
    if (messageCallback) {
      console.warn('请不要重复调用onMessage方法')
      return
    }
    if (!topicMessageCallbackMap.value.has(topic)) {
      topicMessageCallbackMap.value.set(topic, new Set())
    }
    topicMessageCallbackMap.value.get(topic)?.add(callback)
    messageCallback = callback
  }

  const unsubscribe = (callback?: PacketCallback) => {
    if (messageCallback && topicMessageCallbackMap.value.get(topic)?.has(messageCallback)) {
      topicMessageCallbackMap.value.get(topic)?.delete(messageCallback)
    }
    if (topicMessageCallbackMap.value.get(topic)?.size === 0) {
      mqttClient?.unsubscribe(topic, callback)
      topicMessageCallbackMap.value.delete(topic)
      console.log('unsubscribe' + topic)
    }
    messageCallback = undefined
  }

  const publish = (message: Message, t: string = topic, callback?: PacketCallback) => {
    mqttClient?.publish(t, message, { qos: option.qos || 0 }, callback)
  }

  // 组件卸载时取消订阅
  onUnmounted(() => {
    unsubscribe()
  })

  // 立即订阅（根据选项）
  if (option.immediate) {
    subscribe()
  }

  return {
    status,
    subscribe,
    onMessage,
    unsubscribe,
    publish,
  }
}
