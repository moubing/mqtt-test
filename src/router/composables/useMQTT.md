### 设计理念

这个东西能简单就简单，一般情况下它就接受这个topic参数就行了，这个topic就是一个字符串，使用一次useMQTT只会返回关于这一个主题的订阅，取消订阅，发布，监听的方法。如果想订阅多个主题，请多次使用useMQTT。

```ts
const useMQTT: (
  topic: string,
  option?: Option,
) => {
  status: Ref<string, string>
  subscirbe: (callback?: ClientSubscribeCallback) => void
  onMessage: (callback: (data: string | object) => void) => void
  unsubscribe: (callback?: PacketCallback) => void
  publish: (message: Message, callback?: PacketCallback) => void
}
```
