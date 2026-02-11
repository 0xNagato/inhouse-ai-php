import { FastifyPluginCallback } from 'fastify';
import { ChatRequestSchema } from '../schemas';
import { createChatCompletion } from '../openai';
import { getAvailableFunctions, executeFunctionCall } from '../router';
import { filterFunctionsByRole } from '../permissions';
import { logger } from '../logger';
import { redactSensitiveData } from '../redact';

export const chatRoute: FastifyPluginCallback = (fastify, options, done) => {
  // Chat endpoint
  fastify.post('/chat', async (request, reply) => {
    try {
      // Validate request
      const parsed = ChatRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: parsed.error.errors,
        });
      }

      const { message, userId, sessionId, context } = parsed.data;
      const userRole = context?.role || 'user'; // Default to 'user' role
      
      logger.info('Chat request received', {
        userId,
        sessionId,
        userRole,
        messageLength: message.length,
      });

      // Get available functions based on user role
      const allFunctions = getAvailableFunctions();
      const allowedFunctions = filterFunctionsByRole(allFunctions, userRole);

      // System prompt based on role
      const systemPrompt = generateSystemPrompt(userRole);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ];

      // Create chat completion
      const completion = await createChatCompletion(
        messages,
        allowedFunctions.length > 0 ? allowedFunctions : undefined
      );

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from OpenAI');
      }

      let responseMessage = assistantMessage.content || '';
      const functionCalls = [];

      // Handle function calls
      if (assistantMessage.function_call) {
        const functionCall = {
          name: assistantMessage.function_call.name,
          arguments: JSON.parse(assistantMessage.function_call.arguments || '{}'),
        };

        logger.info('Function call requested', {
          functionName: functionCall.name,
          userRole,
          args: redactSensitiveData(functionCall.arguments),
        });

        // Execute function
        const result = await executeFunctionCall(functionCall, userRole);
        functionCalls.push({
          name: functionCall.name,
          arguments: functionCall.arguments,
          result,
        });

        // If function was successful, get a follow-up response
        if (result.success) {
          const followUpMessages = [
            ...messages,
            {
              role: 'assistant',
              content: null,
              function_call: assistantMessage.function_call,
            },
            {
              role: 'function',
              name: functionCall.name,
              content: JSON.stringify(result),
            },
          ];

          const followUpCompletion = await createChatCompletion(followUpMessages);
          responseMessage = followUpCompletion.choices[0]?.message?.content || responseMessage;
        } else {
          responseMessage = `I apologize, but I encountered an error: ${result.error}`;
        }
      }

      const response = {
        message: responseMessage,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        sessionId: sessionId || `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      logger.info('Chat response sent', {
        userId,
        sessionId: response.sessionId,
        responseLength: responseMessage.length,
        functionCallsCount: functionCalls.length,
      });

      return reply.send(response);
    } catch (error) {
      logger.error('Chat request failed', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to process chat request',
      });
    }
  });

  done();
};

function generateSystemPrompt(userRole: string): string {
  const basePrompt = `You are PRIMA AI, a helpful restaurant booking assistant. You can help users search for restaurants, check availability, and make reservations.

Current user role: ${userRole}

Key guidelines:
- Be friendly, professional, and helpful
- Always confirm details before making bookings
- Provide clear information about venues and availability
- If you need to make a booking, ensure you have all required information (name, email, party size, date, time)
- Respect user privacy and only access information appropriate for your role level`;

  const roleSpecificGuidelines = {
    admin: `
- You have full access to all functions including analytics and user information
- You can help with business insights and operational data
- Use analytics functions to provide business intelligence when requested`,
    
    manager: `
- You can access analytics and booking functions
- You can help with operational insights and booking management
- You cannot access sensitive user personal information`,
    
    staff: `
- You can help with searching venues and making bookings
- Focus on customer service and reservation management
- You cannot access analytics or sensitive user data`,
    
    user: `
- You can help search for restaurants and check availability
- You cannot make bookings for others - only provide booking information
- Focus on helping find the perfect dining experience`,
    
    guest: `
- You can help search for restaurants
- You have limited access - mainly browsing and discovery
- Encourage users to sign up for full booking capabilities`,
  };

  return basePrompt + (roleSpecificGuidelines[userRole] || roleSpecificGuidelines.user);
}
