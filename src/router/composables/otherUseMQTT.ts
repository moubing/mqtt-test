import type { IClientOptions, IClientPublishOptions, MqttClient, PacketCallback } from 'mqtt'
import mqtt from 'mqtt'
import { onUnmounted } from 'vue'

type QoS = 0 | 1 | 2
type TopicItem = string | { topic: string; qos?: QoS }
type MessageCallback<T = unknown> = (topic: string, payload: T) => void
type Status = 'connected' | 'disconnected' | 'reconnecting'
type StatusCallback = (s: Status) => void

// 初始化配置
interface MQTTInitOptions extends IClientOptions {
  url?: string
  immediate?: boolean
  parsePayload?: boolean
}

// 全局单例MQTTClient
class GlobalMQTTClient {
  private client: MqttClient | null = null
  private options: MQTTInitOptions = {
    url: 'ws://test.mosquitto.org:8080',
    immediate: true,
    parsePayload: true,
    clientId: '',
    username: '',
    password: '',
  }

  private reconnectAttempts = 0
  private msgHandlers = new Set<MessageCallback>()
  private subs = new Map<string, { qos: QoS; refs: number }>()
  private decoder = new TextDecoder()
  private readonly statusHandlers = new Set<StatusCallback>()

  // 单例连接初始化
  init(options: MQTTInitOptions): void {
    this.options = { ...this.options, ...options }
    if (!this.client) {
      this.connect()
    }
  }

  private connect(): void {
    const { url, ...rest } = this.options
    console.log(url, 'url')
    this.client = mqtt.connect(url!, rest)
    console.log(this.client, 'client')
    // 连接事件
    this.client.on('connect', () => {
      this.reconnectAttempts = 0
      this.emitStatus('connected')
      this.subs.forEach((entry, topic) => {
        this.client!.subscribe(topic, { qos: entry.qos })
      })
    })

    this.client.on('reconnect', () => this.emitStatus('reconnecting'))
    this.client.on('close', () => {
      this.emitStatus('disconnected')
      this.scheduleReconnect()
    })

    this.client.on('message', (topic, payload) => {
      const raw = this.decoder.decode(payload)
      this.msgHandlers.forEach((fn) => fn(topic, raw))
    })
  }

  private scheduleReconnect(): void {
    if (this.client) {
      this.client.end(true)
      this.client = null
    }
    const delay = Math.min(1000 * 2 ** ++this.reconnectAttempts, 30_000)
    setTimeout(() => this.connect(), delay)
  }

  // 订阅与退订
  subscribe(items: TopicItem | TopicItem[], cb?: () => void): void {
    ;(Array.isArray(items) ? items : [items]).forEach((it) => {
      const topic = typeof it === 'string' ? it : it.topic
      const qos: QoS = typeof it === 'string' ? 0 : (it.qos ?? 0)
      const entry = this.subs.get(topic)
      if (entry) {
        entry.refs++
        if (qos > entry.qos) {
          entry.qos = qos
          if (this.client?.connected) this.client.subscribe(topic, { qos }, cb)
        }
        return
      }
      this.subs.set(topic, { qos, refs: 1 })
      if (this.client?.connected) this.client.subscribe(topic, { qos }, cb)
    })
  }

  // !这里他使用refs来表明这里订阅的topic的引用数量，如果有多个组件订阅了相同主题的topic，那么其中的一个使用unsubscrib会导致这个组件仍然能收到信息
  // 上面的话有待验证

  unsubscribe(topics: string | string[], cb?: () => void): void {
    const list = Array.isArray(topics) ? topics : [topics]
    const realOff: string[] = []
    list.forEach((t) => {
      const entry = this.subs.get(t)
      if (entry && --entry.refs === 0) {
        this.subs.delete(t)
        realOff.push(t)
      }
    })
    if (realOff.length && this.client?.connected) this.client.unsubscribe(realOff, {}, cb)
  }

  publish(topic: string, msg: string, opts: IClientPublishOptions = {}, cb?: PacketCallback): void {
    // console.log(this.client, '114 client')
    if (this.client) {
      this.client?.publish(topic, msg, { qos: 0, ...opts }, cb)
    } else {
      console.log('client is none')
    }
  }

  onMessage(handler: MessageCallback): () => void {
    this.msgHandlers.add(handler)
    return () => this.msgHandlers.delete(handler)
  }

  // !这个文件就没有使用过这个方法，导致this.statusHandlers里面一直没有东西
  onStatusChange(handler: StatusCallback): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private emitStatus(s: Status): void {
    this.statusHandlers.forEach((fn) => fn(s))
  }

  dispose(): void {
    this.client?.end(true)
    this.client = null
    this.msgHandlers.clear()
    this.statusHandlers.clear()
    this.subs.clear()
  }
}

const gClient = new GlobalMQTTClient()

export function useMQTT<T = unknown>(topics: TopicItem | TopicItem[], opts: MQTTInitOptions = {}) {
  gClient.init(opts)
  const { immediate = true, parsePayload = true } = opts

  const patterns = new Set<string>(
    (Array.isArray(topics) ? topics : [topics]).map((t) => (typeof t === 'string' ? t : t.topic)),
  )

  if (immediate) gClient.subscribe(topics)

  const decode = (raw: string): T => {
    if (!parsePayload) return raw as unknown as T
    try {
      return JSON.parse(raw)
    } catch {
      return raw as unknown as T
    }
  }

  const onMessage = (cb: MessageCallback<T>): (() => void) => {
    return gClient.onMessage((topic, raw) => {
      const rawString = raw as string // 强制转换 raw 为 string
      if ([...patterns].some((p) => (topic as string).match(p))) {
        cb(topic as string, decode(rawString)) // 传入 string 类型的 raw
      }
    })
  }

  const onMessageOnce = (cb: MessageCallback<T>): (() => void) => {
    const off = onMessage((topic, payload) => {
      cb(topic, payload)
      off() // 自动取消
    })
    return off
  }

  const subscribe = (items?: TopicItem | TopicItem[]) => {
    gClient.subscribe(items ?? topics)
  }

  const unsubscribe = (items?: string | string[]) => {
    gClient.unsubscribe(items ?? [...patterns])
  }

  onUnmounted(() => {
    unsubscribe()
  })

  return {
    subscribe,
    unsubscribe,
    onMessage,
    onMessageOnce,
    publish: gClient.publish,
  }
}
