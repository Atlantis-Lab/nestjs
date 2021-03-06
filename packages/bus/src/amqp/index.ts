import AmqpConnectionManager from './amqp-connection-manager'

export const connect = (urls, options?) =>
  new AmqpConnectionManager(
    // @ts-ignore
    Array.isArray(urls) ? urls : [urls],
    // @ts-ignore
    options
  )

const amqp = {
  connect,
}

export default amqp
