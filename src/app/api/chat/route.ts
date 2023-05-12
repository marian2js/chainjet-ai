import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const axiosInstance = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
})

export async function POST(req: NextRequest) {
  // const body = await req.json()
  const body = await req.json()
  const text = body.text
  if (!text) {
    return NextResponse.json({ data: 'No text provided!', statusCode: 400 })
  }

  const prompt =
    `You are an AI assistant to a Zapier like software that connects a trigger with a set of actions. ` +
    `Your job is to return the configuration required to create the workflow following the user's request. ` +
    `You must use one trigger. You must use at least one action, but you can use more. The order of the action's is important. ` +
    `The outputs of one module can be feed to the following module. ` +
    `To use an output from a previous module, you must use "{{0.outputKey}}", where 0 is the index of the module. (0 will always be the trigger, and 1 will always be the first action). ` +
    `You must reply only with the list of modules and their configurations. ` +
    `If information is missing, use "{{input.key}}". For example "{{input.lensHandle}}"` +
    // `Each module defines a set of outputs. ` +
    // `You need to know the outputs to know what keys to send. ` +
    // `Please ask any output keys you need in the format: Outputs: ModuleA, ModuleB, ModuleC` +
    `Operations are defined in the format: Protocol.method(inputs): outputs

    Trigger Modules:
    Blockchain.newTransaction(chainId: number, address: string): hash: string
    Lens.newPost(content: string): id: string
    Lens.newFollower(handle: string): handle: string
    Mirror.newArticle(address: string): title: string, content: string, url: string
    
    Action Modules:
    Lens.createPost(content: string): void
    Lens.followUser(handle: string): void
    OpenAI.sendPrompt(prompt: string): response: string
    
    Example: 
    User: Share my Ethereum transactions on Lens.
    Assistant:
    Blockchain.newTransaction({{input.address}})
    Lens.createPost({{0.hash}})`

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: text },
  ]

  // const res = await axiosInstance.post('', {
  //   model: 'gpt-3.5-turbo', // TODO use GPT-4
  //   messages: messages,
  //   max_tokens: 100,
  // })

  // if (res.data?.choices?.[0]?.message?.content) {
  //   const completion = res.data.choices[0].message.content
  //   return NextResponse.json({ data: completion })
  // }

  return NextResponse.json({ data: 'Completion not found!' })
}
