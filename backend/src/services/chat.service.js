"use strict";

const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");
const User = require("../models/User");
const Document = require("../models/Document");
const { generateChatResponse } = require("./aiClient.service");

const MAX_MESSAGE_LENGTH = 10000;
const HISTORY_MESSAGE_LIMIT = 12;

function getVisibleDocumentFilter(user) {
  const filter = { isActive: { $ne: false } };

  if (user.role === "student") {
    filter.visibility = "PUBLIC";
  } else if (user.role === "teacher") {
    filter.visibility = { $in: ["PUBLIC", "TEACHER_ONLY"] };
  } else if (user.role !== "admin") {
    // Roles without a document-access policy must receive no documents.
    filter._id = { $in: [] };
  }

  return filter;
}

function toAIConversation(messages) {
  return messages
    .filter((entry) => ["user", "assistant"].includes(entry.role))
    .map((entry) => ({
      role: entry.role,
      content: entry.message,
    }))
    .filter((entry) => entry.content && entry.content.trim());
}

function toStoredSources(sources, accessibleDocuments) {
  if (!Array.isArray(sources)) return [];

  const allowedByAIId = new Map(
    accessibleDocuments.map((document) => [
      String(document.aiDocumentId || document._id),
      document,
    ]),
  );
  const seenDatabaseIds = new Set();
  const safeSources = [];

  for (const source of sources) {
    const aiDocumentId = String(source?.document_id || "");
    const document = allowedByAIId.get(aiDocumentId);
    if (!document) continue;

    const databaseId = String(document._id);
    if (seenDatabaseIds.has(databaseId)) continue;
    seenDatabaseIds.add(databaseId);

    safeSources.push({
      documentId: databaseId,
      title: String(source.title || document.title || "College document"),
      page: Number.isInteger(source.page) && source.page > 0 ? source.page : undefined,
    });
  }

  return safeSources;
}

async function createSessionService(userId) {
  return ChatSession.create({
    user: userId,
    title: "New Chat",
  });
}

async function getUserSessionsService(userId) {
  return ChatSession.find({
    user: userId,
    isDeleted: false,
  }).sort({ updatedAt: -1 });
}

async function getSessionMessagesService(sessionId, userId) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    user: userId,
    isDeleted: false,
  });

  if (!session) {
    throw new Error("Chat session not found");
  }

  return ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 });
}

async function deleteSessionService(sessionId, userId) {
  const session = await ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      user: userId,
      isDeleted: false,
    },
    { isDeleted: true },
    { returnDocument: "after" },
  );

  if (!session) {
    throw new Error("Chat session not found");
  }

  return { message: "Chat deleted successfully" };
}

async function renameSessionService(sessionId, userId, title) {
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Chat title is required");
  }

  const session = await ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      user: userId,
      isDeleted: false,
    },
    { title: title.trim().slice(0, 100) },
    { returnDocument: "after", runValidators: true },
  );

  if (!session) {
    throw new Error("Chat session not found");
  }

  return session;
}

async function sendMessageService({ sessionId, userId, message }) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  const normalizedMessage = message.trim();
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }

  const [session, user] = await Promise.all([
    ChatSession.findOne({
      _id: sessionId,
      user: userId,
      isDeleted: false,
    }),
    User.findById(userId).populate("department", "name code"),
  ]);

  if (!session) {
    throw new Error("Chat session not found");
  }
  if (!user || user.isActive === false) {
    throw new Error("User account is unavailable");
  }

  const allowedDocuments = await Document.find(getVisibleDocumentFilter(user))
    .select("_id aiDocumentId title")
    .lean();
  const accessibleDocumentIds = allowedDocuments.map(
    (document) => String(document.aiDocumentId || document._id),
  );

  // The AI API historically treats an empty allow-list as unrestricted. This
  // explicit flag prevents an empty backend authorization result from exposing
  // every indexed document.
  const previousMessages = await ChatMessage.find({ session: sessionId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_MESSAGE_LIMIT)
    .lean();

  const department = user.department;
  const aiResponse = await generateChatResponse({
    message: normalizedMessage,
    conversation: toAIConversation(previousMessages.reverse()),
    user_context: {
      role: user.role || null,
      department: department?.code || department?.name || null,
      semester: Number.isInteger(user.semester) ? user.semester : null,
    },
    accessible_document_ids: accessibleDocumentIds,
    deny_document_retrieval: accessibleDocumentIds.length === 0,
  });

  if (!aiResponse || typeof aiResponse.answer !== "string" || !aiResponse.answer.trim()) {
    const error = new Error("AI service returned an empty answer");
    error.statusCode = 502;
    throw error;
  }

  const safeSources = toStoredSources(aiResponse.sources, allowedDocuments);

  // Save the user and assistant turns only after the model response has been
  // received, so upstream failures don't leave a misleading partial exchange.
  await ChatMessage.create({
    session: sessionId,
    role: "user",
    message: normalizedMessage,
  });

  const assistantMessage = await ChatMessage.create({
    session: sessionId,
    role: "assistant",
    message: aiResponse.answer.trim(),
    sources: safeSources,
  });

  if (session.title === "New Chat") {
    session.title =
      normalizedMessage.length > 40
        ? `${normalizedMessage.substring(0, 40)}...`
        : normalizedMessage;
  }

  session.lastMessage = normalizedMessage;
  await session.save();

  return {
    answer: aiResponse.answer.trim(),
    grounded: Boolean(aiResponse.grounded),
    queryType: aiResponse.query_type || "UNSUPPORTED",
    sources: safeSources,
    messageId: String(assistantMessage._id),
  };
}

module.exports = {
  createSessionService,
  getUserSessionsService,
  getSessionMessagesService,
  deleteSessionService,
  renameSessionService,
  sendMessageService,
  getVisibleDocumentFilter,
  toStoredSources,
};
