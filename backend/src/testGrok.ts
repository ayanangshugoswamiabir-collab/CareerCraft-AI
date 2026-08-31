import 'dotenv/config'
import { generateText } from 'ai'
import { createXai } from '@ai-sdk/xai'

const apiKey = process.env.XAI_API_KEY

if (!apiKey) {
  throw new Error('XAI_API_KEY is missing')
}

const xai = createXai({
  apiKey,
})

const run = async () => {
  try {
    console.log('Testing Grok API #1...')

    const result = await generateText({
      model: xai('grok-4.6'),
      prompt: 'Reply with exactly: GROK API WORKS',
    })

    console.log('Grok response:')
    console.log(result.text)
  } catch (error) {
    console.error('Grok API test failed:')
    console.error(error)
  }
}

void run()