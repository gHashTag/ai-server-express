import { openai } from '../openai'

type GetAiSupabaseFeedbackT = {
  assistant_id: string
  report: string
  language_code: string
  full_name: string
}

export async function getAiFeedbackFromSupabase({
  assistant_id,
  report,
  language_code,
  full_name,
}: GetAiSupabaseFeedbackT): Promise<{ ai_response: string }> {
  if (!assistant_id) throw new Error('Assistant ID is not set')
  if (!report) throw new Error('Report is not set')
  if (!language_code) throw new Error('Language code is not set')
  if (!full_name) throw new Error('Full name is not set')

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not set')
  }

  try {
    // Step 1: Create a thread with necessary parameters
    const thread = await openai.beta.threads.create()

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `response in language: ${language_code} prompt: ${report}`,
    })

    // Step 3: Run the assistant using assistantId
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id,
      instructions: `You are the host of the self-realization game Leela Chakra. You must answer the user's questions and help him in the game.
You must address the user by his name: ${full_name}`,
    })

    // Step 4: Periodically retrieve the run to check its status
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(run.thread_id)
      for (const message of messages.data.reverse()) {
        console.log(message, 'message')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return { ai_response: messages.data.reverse()[0].content[0].text.value }
      }
    } else {
      console.log(run.status)
    }
  } catch (error) {
    console.error('Error querying OpenAI Assistant:', error)
    throw error
  }
}
