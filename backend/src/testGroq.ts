import 'dotenv/config'
import Groq from 'groq-sdk'

const apiKey = process.env.GROQ_API_KEY

if (!apiKey) {
  throw new Error('GROQ_API_KEY is missing')
}

const groq = new Groq({
  apiKey,
})

async function testGroq() {
  try {
    console.log('Testing Groq API...')

    const completion =
      await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'user',
            content:
              'Reply with exactly: Groq API is working',
          },
        ],
      })

    const result =
      completion.choices[0]?.message?.content

    console.log('\nGroq response:')
    console.log(result)
  } catch (error) {
    console.error('\nGroq API test failed:')
    console.error(error)
  }
}

void testGroq()