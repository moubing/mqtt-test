import type { IClientSubscribeOptions, MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { v4 as uuidv4 } from 'uuid'
import { onMounted, onUnmounted, ref } from 'vue'

type Option = IClientSubscribeOptions & {
  immediate: boolean
  isIdempotent: boolean
}
type Message = string | object | Buffer
type MessageCallback = (data: string | object) => void
type MessageItem = {
  id: string
  messageCallback: MessageCallback
  isIdempotent: boolean
}
type MessageData = {
  id: string
  type: 'inquire' | 'leader res' | 'elect leader' | 'killed'
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
const defaultOption: Option = { immediate: true, isIdempotent: false, qos: 1 }


const initMQTTClient = (option: Partial<Option>, messageCallback: (t: string, payload: Buffer) => void) => {
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
          mqttClient?.subscribe(topic, { qos: option?.qos || 1 }, (err) => {
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

    mqttClient.on('message', messageCallback)
  }
}

export const useMQTT = (
  topic: string,
  option: Partial<Option>,
) => {
  if (!topic) throw new Error('使用useMQTT的第一个参数（主题）不能为空字符串')
      option = {
    ...defaultOption,
    ...option,
  }
  const id = uuidv4()
  const bc = new BroadcastChannel(topic)
  const recognizedLeader = ref<string | undefined>(undefined)
  let idSet: Set<string> = new Set([id])
  const status = ref<'normal' | 'leader'>('normal')
  let hasRespond = false
  let electTimer: number | NodeJS.Timeout | undefined = undefined

  bc.onmessage = (e: MessageEvent) => {
    const data = e.data as MessageData
    if (data.type === 'inquire' && status.value === 'normal') {
      console.log(`【${topic}】【${id}】[normal]收到了【${data.type}】消息，来自于【${data.id}】`)
      hasRespond = true
      clearTimeout(electTimer)
      idSet.add(data.id)
      const firstId = Array.from(idSet).sort()[0]
      electTimer = setTimeout(() => {
        console.log(`【${topic}】【${id}】[normal]发出【elect leader】消息，认为大哥是${firstId}`)
        recognizedLeader.value = firstId
        if (id === firstId) {
          status.value = 'leader'
        }

        bc.postMessage({
          type: 'elect leader',
          id,
          leaderId: firstId,
        } as MessageData)
      }, 300)
    } else if (data.type === 'inquire' && status.value === 'leader') {
      console.log(
        `【${topic}】【${id}】[leader]收到了【${data.type}】消息，来自于【${data.id}】，并重新宣布自己是大哥`,
      )
      bc.postMessage({
        type: 'leader res',
        id,
        leaderId: id,
      } as MessageData)
    } else if (data.type === 'elect leader' && status.value === 'normal') {
      console.log(`【${topic}】【${id}】[normal]收到了【${data.type}】消息，来自于【${data.id}】`)
      hasRespond = true
      recognizedLeader.value = data.leaderId
      if (id === data.leaderId) {
        console.log(`【${topic}】【${id}】[normal]发现自己被选举为了大哥`)
        status.value = 'leader'
      }
    } else if (data.type === 'elect leader' && status.value === 'leader') {
      console.log(
        `【${topic}】【${id}】[leader]收到了【${data.type}】消息，来自于【${data.id}】，并发布消息禁止选举`,
      )
      bc.postMessage({
        type: 'leader res',
        id,
        leaderId: id,
      } as MessageData)
    } else if (data.type === 'leader res' && status.value === 'normal') {
      console.log(
        `【${topic}】【${id}】[normal]收到了【${data.type}】消息，来自于【${data.id}】，更改自己认可的大哥`,
      )
      hasRespond = true
      clearTimeout(electTimer)
      recognizedLeader.value = data.leaderId
    } else if (data.type === 'killed') {
      console.log(
        `【${topic}】【${id}】[normal]收到了【${data.type}】消息，来自于【${data.id}】，大哥死了，重新选举`,
      )
      hasRespond = false
      idSet = new Set([id])
      recognizedLeader.value = undefined
      setTimeout(() => {
        console.log(`【${topic}】【${id}】发出了【inquire】消息`)
        bc.postMessage({
          type: 'inquire',
          id,
        } as MessageData)
      }, 0)
    }
  }
  setTimeout(() => {
    console.log(`【${topic}】【${id}】发出了【inquire】消息`)
    bc.postMessage({
      type: 'inquire',
      id,
    } as MessageData)
  }, 0)
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
        console.log(id, 'id')
        console.log(recognizedLeader.value, 'recon leader')
        console.log(hasRespond, 'has respond')
        if (item.id === recognizedLeader.value || item.isIdempotent || !hasRespond) {
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
      isIdempotent: option?.isIdempotent || false,
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
    let msg = message
    if (Object.prototype.toString.call(message) === '[object Object]') {
      msg = JSON.stringify(message)
    }
    mqttClient?.publish(t, msg as string, { qos: option.qos || 1 }, callback)
  }

  const connect = () => {
    mqttClient?.connect()
  }

  const disconnect = () => {
    mqttClient?.end()
  }

  const beforeUnloadHandler = () => {
    if (id === recognizedLeader.value) {
      console.log(`【${topic}】【${id}】发出了【killed】消息`)
      bc.postMessage({
        type: 'killed',
        id,
      } as MessageData)
    }
    bc.close()
  }

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler)
  })

  // 组件卸载时取消订阅
  onUnmounted(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    beforeUnloadHandler()
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
