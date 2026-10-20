const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");

const createSessionService = async (userId) => {
  const session = await ChatSession.create({
    user: userId,
    title: "New Chat",
  });

  return session;
};

const getUserSessionsService = async (userId) => {
  return await ChatSession.find({
    user: userId,
    isDeleted: false,
  }).sort({ updatedAt: -1 });
};

const getSessionMessagesService = async (
  sessionId,
  userId
) => {
  const session = await ChatSession.findOne({
    _id: sessionId,
    user: userId,
    isDeleted: false,
  });

  if (!session) {
    throw new Error("Chat session not found");
  }

  return await ChatMessage.find({
    session: sessionId,
  }).sort({ createdAt: 1 });
};

const deleteSessionService = async (
  sessionId,
  userId
) => {
  const session = await ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      user: userId,
    },
    {
      isDeleted: true,
    },
    {
      returnDocument: "after",
    }
  );

  if (!session) {
    throw new Error("Chat session not found");
  }

  return {
    message: "Chat deleted successfully",
  };
};

const renameSessionService = async (
  sessionId,
  userId,
  title
) => {
  const session = await ChatSession.findOneAndUpdate(
    {
      _id: sessionId,
      user: userId,
    },
    {
      title,
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!session) {
    throw new Error("Chat session not found");
  }

  return session;
};

const sendMessageService = async ({
  sessionId,
  userId,
  message,
}) => {
  const session = await ChatSession.findOne({
    _id: sessionId,
    user: userId,
    isDeleted: false,
  });

  if (!session) {
    throw new Error("Chat session not found");
  }

  await ChatMessage.create({
    session: sessionId,
    role: "user",
    message,
  });

  const assistantReply =
    "This is a temporary AI response.";

  await ChatMessage.create({
    session: sessionId,
    role: "assistant",
    message: assistantReply,
    sources: [],
  });

  if (session.title === "New Chat") {
    const generatedTitle =
      message.length > 40
        ? message.substring(0, 40) + "..."
        : message;

    session.title = generatedTitle;
  }

  session.lastMessage = message;
  await session.save();

  return {
    answer: assistantReply,
  };
};

module.exports = {
  createSessionService,
  getUserSessionsService,
  getSessionMessagesService,
  deleteSessionService,
  renameSessionService,
  sendMessageService,
};