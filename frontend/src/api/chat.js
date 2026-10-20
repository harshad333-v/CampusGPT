import { API_BASE_URL } from './client'

function getHeaders() {
  const token = localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// Create a new chat session
async function createChatSession() {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: 'POST',
    headers: getHeaders(),
  })

  return response.json()
}

// Get all chat sessions
async function getChatSessions() {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: 'GET',
    headers: getHeaders(),
  })

  return response.json()
}

// Get messages from a specific chat session
async function getChatMessages(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}/messages`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )

  return response.json()
}

// Send a message to a chat session
async function sendChatMessage(sessionId, message) {
  const response = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
      }),
    }
  )

  return response.json()
}

// Rename a chat session
async function renameChatSession(sessionId, title) {
  const response = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}/title`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
      }),
    }
  )

  return response.json()
}

// Delete a chat session
async function deleteChatSession(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/chat/sessions/${sessionId}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  )

  return response.json()
}

export {
  createChatSession,
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  renameChatSession,
  deleteChatSession,
}