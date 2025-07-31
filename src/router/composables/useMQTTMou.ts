import type { IClientSubscribeOptions, MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { onMounted, onUnmounted, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

type Option = IClientSubscribeOptions & {
  immediate: boolean
  isIdempotent: boolean
}
type Message = string | Buffer
type MessageCallback = (data: string | object) => void
type MessageItem = {
  id: string
  messageCallback: MessageCallback
  isIdempotent: boolean
}
type MessageData = {
  id: string
  type: 'inquire' | 'leader res' | 'confirm' | 'killed'
  leaderId?: string
}

// 全局单例 MQTT 客户端
let mqttClient: MqttClient | null = null
// const topicMessageCallbackMap: Map<string, Set<MessageItem>> = new Map()
const connectionStatus = ref('disconnected')
// const url = 'ws://test.mosquitto.org:8080'
const url = 'ws://broker.hivemq.com:8000/mqtt'
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

export const topicMessageItemMap = ref<Map<string, Set<MessageItem>>>(new Map())

const initMQTTClient = (
  option: Option,
  onMessageCallback: (t: string, payload: Buffer) => void,
) => {
  if (!mqttClient) {
    mqttClient = mqtt.connect(url, {
      reconnectPeriod: 0, // 禁用自动重连
      clean: true, // 清除会话
    })

    // 全局事件只需绑定一次
    mqttClient.on('connect', () => {
      console.log('连接成功', Date.now().toLocaleString())
      connectionStatus.value = 'connected'
      reconnectAttempts = 0
      if (option.immediate) {
        topicMessageItemMap.value.forEach((_, topic) => {
          mqttClient?.subscribe(topic, { qos: option.qos }, (err) => {
            if (err) console.error(`订阅失败 [${topic}]:`, err)
            else console.log(`订阅成功 [${topic}]`)
          })
        })
      }
    })

    mqttClient.on('reconnect', () => {
      console.log('重连成功', Date.now().toLocaleString())
      connectionStatus.value = 'connected'
    })

    mqttClient.on('close', () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('重连次数超限，请检查网络')
        return
      }
      console.log('连接关闭', Date.now().toLocaleString())
      connectionStatus.value = 'disconnected'
      const delay = 1000 * Math.pow(2, reconnectAttempts)
      setTimeout(() => mqttClient?.reconnect(), delay)
      reconnectAttempts++
    })

    mqttClient.on('error', (err) => {
      console.error('连接错误', err)
      connectionStatus.value = 'disconnected'
    })

    mqttClient.on('message', onMessageCallback)
  }
}

export const useMQTT = (
  topic: string,
  option: Option = { immediate: true, isIdempotent: true, qos: 1 },
) => {
  if (!topic) throw new Error('使用useMQTT的第一个参数（主题）不能为空字符串')
  const id = uuidv4()
  const bc = new BroadcastChannel(topic)
  const recognizedLeader = ref<string | undefined>(undefined)
  let idSet: Set<string> = new Set([id])
  const status = ref<'normal' | 'candidate' | 'leader'>('normal')
  let inquireTimer: number | NodeJS.Timeout | undefined = undefined
  let noResTimer: number | NodeJS.Timeout | undefined = undefined
  let electTimer: number | NodeJS.Timeout | undefined = undefined

  bc.onmessage = (e: MessageEvent) => {
    const data = e.data as MessageData
 if (data.id === id) return
    if (data.type === 'inquire' && status.value === 'normal') {
      clearTimeout(inquireTimer)
      clearTimeout(noResTimer)
    } else if (data.type === 'inquire' && status.value === 'candidate') {
      clearTimeout(noResTimer)
      clearTimeout(electTimer)
      idSet.add(data.id)
      electTimer = setTimeout(() => {
        bc.postMessage({
          type: 'leader res',
          id,
          leaderId: Array.from(idSet).sort()[0],
        } as MessageData)
        console.log(
          `【${topic}】【${id}】【${status.value}】收到了【${data.type}】消息,认为大哥是【${Array.from(idSet).sort()[0]}】,来自于【${data.id}】`,
        )
      }, 300)
    } else if (data.type === 'inquire' && status.value === 'leader') {
      console.log(
        `【${topic}】【${id}】【${status.value}】收到了【${data.type}】消息,来自于【${data.id}】`,
      )
      bc.postMessage({
        type: 'leader res',
        id,
        leaderId: id,
      } as MessageData)
    } else if (data.type === 'leader res') {
      clearTimeout(noResTimer)

      console.log(
        `【${topic}】【${id}】【${status.value}】收到了【${data.type}】消息,大哥为【${data.leaderId}】,来自于【${data.id}】`,
      )
      recognizedLeader.value = data.leaderId
      status.value = 'normal'
      if (id === data.leaderId) {
        status.value = 'leader'
      }
      idSet = new Set([id])
    } else if (data.type === 'killed') {
      startInquire()
    }
  }

  const startInquire = () => {
    inquireTimer = setTimeout(() => {
      console.log(`【${topic}】【${id}】询问`)
      status.value = 'candidate'
      bc.postMessage({
        type: 'inquire',
        id,
      } as MessageData)
    }, 300)
    noResTimer = setTimeout(() => {
      console.log(`【${topic}】【${id}】由于没有得到回复，那么我成为leader`)
      status.value = 'leader'
      recognizedLeader.value = id
      bc.postMessage({
        type: 'leader res',
        id,
        leaderId: id,
      } as MessageData)
    }, 500)
  }

  startInquire()
  initMQTTClient(option, (t: string, payload: Buffer) => {
    const messageItems = topicMessageItemMap.value.get(t)
    if (messageItems) {
      let data = undefined
      try {
        data = JSON.parse(payload.toString())
      } catch {
        data = payload.toString()
      }
      console.log(`收到消息 [${t}]:`, data)
      messageItems.forEach((item) => {
        if (id === recognizedLeader.value) {
          item.messageCallback(data)
        } else if (item.isIdempotent) {
          item.messageCallback(data)
        } else {
          console.log('当前useMQTT不是leader，并且这个回调是非幂等性操作，不能调用它', item, id)
        }
      })
    }
  }) // 确保客户端初始化
  let messageItem: MessageItem | undefined = undefined

  const subscribe = (callback: ClientSubscribeCallback = () => {}) => {
    mqttClient?.subscribe(topic, { qos: option.qos || 1 }, (err) => {
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
    if (messageItem?.messageCallback) {
      console.warn('请不要重复调用onMessage方法')
      return
    }
    if (!topicMessageItemMap.value.has(topic)) {
      topicMessageItemMap.value.set(topic, new Set())
    }
    messageItem = {
      id,
      messageCallback: callback,
      isIdempotent: option.isIdempotent,
    }
    topicMessageItemMap.value.get(topic)?.add(messageItem)
  }

  const unsubscribe = (callback?: PacketCallback) => {
    if (messageItem && topicMessageItemMap.value.get(topic)?.has(messageItem)) {
      topicMessageItemMap.value.get(topic)?.delete(messageItem)
    }
    if (topicMessageItemMap.value.get(topic)?.size === 0) {
      mqttClient?.unsubscribe(topic, callback)
      topicMessageItemMap.value.delete(topic)
      console.log('unsubscribe' + topic)
    }
    messageItem = undefined
  }

  const publish = (message: Message, t: string = topic, callback?: PacketCallback) => {
    mqttClient?.publish(t, message, { qos: option.qos || 1 }, callback)
  }

  const connect = () => {
    mqttClient?.connect()
  }

  const disconnect = () => {
    mqttClient?.end()
  }

  const beforeUnloadHandler = () => {
    console.log(id === recognizedLeader.value, '是不是leader')
    if (id === recognizedLeader.value) {
      bc.postMessage({
        type: 'killed',
        id,
      } as MessageData)
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler)
  })

  // 组件卸载时取消订阅
  onUnmounted(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    if (recognizedLeader.value === id) {
      bc.postMessage({
        type: 'killed',
        id,
      } as MessageData)
    }
    unsubscribe()
  })

  return {
    connectionStatus,
    recognizedLeader,
    id,
    status,
    connect,
    disconnect,
    subscribe,
    onMessage,
    unsubscribe,
    publish,
  }
}
