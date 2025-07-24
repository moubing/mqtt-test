<script setup lang="ts">
import MQTTDemo from './components/MQTTDemo.vue'
// import mqtt from 'mqtt' // import namespace "mqtt"

// const client = mqtt.connect('ws://test.mosquitto.org:8080') // create a client
// console.log(client, 'client')

// client.on('connect', () => {
//   client.subscribe('presence', (err) => {
//     console.log('hello world')
//     if (!err) {
//       client.publish('presence', 'Hello mqtt')
//     }
//   })
// })

// client.on('message', (topic, message) => {
//   // message is Buffer
//   console.log(message.toString())
//   client.end()
// })
// client.on('connect', () => {
//   console.log('✅ Connected to broker')
// })

// client.on('error', (err) => {
//   console.error('❌ Connection error:', err)
// })

// client.on('close', () => {
//   console.log('🚪 Connection closed')
// })

// client.on('reconnect', () => {
//   console.log('🔄 Reconnecting...')
// })

// client.on('offline', () => {
//   console.log('📴 Client offline')
// })
</script>

<template>
  <!-- <header> -->
  <!-- <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" /> -->

  <!-- <div class="wrapper"> -->
  <!-- <HelloWorld msg="You did it!" /> -->
  <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
  <!-- </div>
  </header>

  <RouterView /> -->
  <div>
    <MQTTDemo />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
