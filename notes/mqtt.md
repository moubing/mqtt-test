### qos（服务质量等级）

- qos 0: 实时数据流（如股票报价、传感器高频数据）。
- qos 1​​：重要但可容忍重复的操作（如智能家居控制）。
- qos 2​​：不允许丢失或重复的关键操作（如金融交易）。

黄金法则：实际qos = min(发布qos, 订阅qos)，​​重要消息应在发布端确保高qos​！

### 
第一版
```ts

import type { IClientSubscribeOptions, MqttClient, PacketCallback } from 'mqtt'
import mqtt, { type ClientSubscribeCallback } from 'mqtt'
import { onUnmounted, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid';

type Option = IClientSubscribeOptions & {
  immediate: boolean,
  isIdempotent : boolean
}
type Message = string | Buffer
type MessageCallback = (data: string | object) => void
type MessageItem = {
  id: string,
  messageCallback: MessageCallback,
  isIdempotent: boolean
}
type MessageData = {
  id: string
  type: 'vote' | 'confirm' | 'agree' | 'disagree' | 'killed'
  leaderId?: string
}


// 全局单例 MQTT 客户端
let mqttClient: MqttClient | null = null
// const topicMessageCallbackMap: Map<string, Set<MessageItem>> = new Map()
const status = ref('disconnected')
// const url = 'ws://test.mosquitto.org:8080'
const url = 'ws://broker.hivemq.com:8000/mqtt'
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10

export const topicMessageItemMap = ref<Map<string, Set<MessageItem>>>(new Map())

const initMQTTClient = (option: Option, onMessageCallback:(t:string, payload: Buffer) => void) => {
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

    mqttClient.on('message', onMessageCallback)
  }
}

export const useMQTT = (topic: string, option: Option = { immediate: true, isIdempotent : true,qos: 1 }) => {
  if (!topic) throw new Error('使用useMQTT的第一个参数（主题）不能为空字符串')
  const id = uuidv4()
  const bc = new BroadcastChannel(topic)
  let recognizedLeader: string | undefined = undefined
  let idArr: string[] = [id]
  let confirmTimer: number | NodeJS.Timeout | undefined = undefined
  let agreeTimer: number | NodeJS.Timeout | undefined = undefined
  let redoTimer: number | NodeJS.Timeout | undefined = undefined

  bc.onmessage = (e: MessageEvent) => {
    const data = e.data as MessageData
    if(data.id === id) return
    if (data.type === 'vote') {
      console.log(`【${topic}】【${id}】收到了【${data.type}】消息，来自于【${data.id}】`)
      clearTimeout(confirmTimer)
      idArr.push(data?.id)
      confirmTimer = setTimeout(() => {
        const leaderId = idArr.sort()[0]
        bc.postMessage({
          type: 'confirm',
          leaderId,
          id,
        } as MessageData)
      }, 3000)
    } else if (data.type === 'confirm') {
      console.log(`【${topic}】【${id}】收到了【${data.type}】消息，大哥为【${data.leaderId}】,来自于【${data.id}】`)
      if (data.leaderId === idArr.sort()[0]) {
        bc.postMessage({
          type: 'agree',
          leaderId: data.leaderId,
          id,
        } as MessageData)
      } else {
        bc.postMessage({
          type: 'disagree',
          id,
        } as MessageData)
      }
    } else if (data.type === 'agree') {
      console.log(`【${topic}】【${id}】收到了【${data.type}】消息，同意大哥为【${data.leaderId}】,来自于【${data.id}】`)
      clearTimeout(agreeTimer)
      agreeTimer = setTimeout(() => {
        recognizedLeader = data.leaderId
      }, 3000)
    } else if (data.type === 'disagree' || data.type === 'killed') {
      console.log(`【${topic}】【${id}】收到了【${data.type}】消息，来自于【${data.id}】`)
      idArr = [id]
      clearTimeout(agreeTimer)
      clearTimeout(redoTimer)
      redoTimer = setTimeout(() => {
        bc.postMessage({
          type: 'vote',
          id,
        } as MessageData)
      }, 3000)
    }
  }
  setTimeout(() => {
      console.log(`【${topic}】【${id}】发起投票`)

    bc.postMessage({
      type: 'vote',
      id,
    } as MessageData)
  }, 3000);
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
          if(id === recognizedLeader) {
            item.messageCallback(data)
          } else if(item.isIdempotent) {
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
      isIdempotent: option.isIdempotent
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
  // 组件卸载时取消订阅
  onUnmounted(() => {
    if(recognizedLeader === id) {
      bc.postMessage({
        type: 'killed',
        id
      } as MessageData)
    }
    unsubscribe()
  })

  return {
    status,
    id,
    connect,
    disconnect,
    subscribe,
    onMessage,
    unsubscribe,
    publish,
  }
}

```