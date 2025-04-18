import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json();

    // Format the chat history for context
    const formattedHistory = chatHistory?.map((msg: any) => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: msg.content
    })) || [];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Oracle, a mindful AI assistant that helps users process their thoughts. Respond with empathy and insight. Your goal is to help them untangle their mind and gain clarity.

Important guidelines for loop creation:
1. When a user responds with strong affirmations like "yes", "absolutely", "definitely", "for sure", or similar enthusiastic responses, this is often a sign they're ready to create a loop.
2. Look for moments when a conversation about a specific topic or challenge has reached a natural conclusion.
3. When the user expresses interest in exploring a topic further or tackling a specific problem.
4. Be particularly attentive after providing advice or suggestions - if they agree, it's a good time to create a loop.

Your responses should be conversational and not mention loops explicitly unless the user asks about them directly.`
        },
        ...formattedHistory,
        {
          role: "user",
          content: message
        }
      ],
      functions: [
        {
          name: "generate_ai_response",
          description: "Generate a structured response for the user's input",
          parameters: {
            type: "object",
            properties: {
              reflection: {
                type: "string",
                description: "A thoughtful reflection on what the user shared"
              },
              coaching: {
                type: "string",
                description: "Coaching advice to help the user move forward"
              },
              shouldCreateLoopz: {
                type: "boolean",
                description: "Whether this thought might benefit from being tracked as a loop"
              },
              suggestedTitle: {
                type: "string",
                description: "A suggested title for a potential loop based on the user's input"
              },
              tasks: {
                type: "array",
                items: { type: "string" },
                description: "Suggested tasks to help address what's on the user's mind"
              }
            },
            required: ["reflection", "coaching"]
          }
        }
      ],
      function_call: { name: "generate_ai_response" }
    });

    // Parse the AI response
    const functionCall = response.choices[0]?.message?.function_call;
    if (functionCall && functionCall.name === "generate_ai_response") {
      const parsedResponse = JSON.parse(functionCall.arguments);
      return NextResponse.json(parsedResponse);
    }

    // Fallback if function call format isn't available
    return NextResponse.json({
      reflection: response.choices[0]?.message?.content || "I understand your thoughts. Would you like to explore this further?",
      coaching: "Take a moment to reflect on what matters most to you right now."
    });

  } catch (error) {
    console.error('Oracle API error:', error);
    return NextResponse.json(
      {
        reflection: "I'm having trouble processing that right now.",
        coaching: "Let's try a different approach."
      },
      { status: 500 }
    );
  }
} 