import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('craft'))

export default app
