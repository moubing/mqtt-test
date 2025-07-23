import mqtt from 'mqtt' // import namespace "mqtt"
const client = mqtt.connect('mqtt://test.mosquitto.org') // create a client

client.on('connect', () => {
  client.subscribe('presence', (err) => {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})

client.on('message', (topic, message) => {
  // message is Buffer
  console.log(message.toString())
  client.end()
})
