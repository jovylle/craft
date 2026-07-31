import { createApp } from './app'
import { createDataClient } from './data/client'

const app = createApp({ data: createDataClient() })

export default app
