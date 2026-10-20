const {
  createSessionService,
  getUserSessionsService,
  getSessionMessagesService,
  deleteSessionService,
  renameSessionService,
  sendMessageService,
} = require("../services/chat.service");

const createSession = async (req, res) => {
  try {
    const session = await createSessionService(
      req.user.id
    );

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const sessions =
      await getUserSessionsService(req.user.id);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSessionMessages = async (req, res) => {
  try {
    const messages =
      await getSessionMessagesService(
        req.params.id,
        req.user.id
      );

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const result = await sendMessageService({
      sessionId: req.params.id,
      userId: req.user.id,
      message: req.body.message,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const renameSession = async (req, res) => {
  try {
    const session = await renameSessionService(
      req.params.id,
      req.user.id,
      req.body.title
    );

    return res.status(200).json({
      success: true,
      message: "Chat renamed successfully",
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const result = await deleteSessionService(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSession,
  getUserSessions,
  getSessionMessages,
  sendMessage,
  renameSession,
  deleteSession,
};