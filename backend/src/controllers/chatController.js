const Message = require('../models/Message');
const { ensureChatAccess } = require('../utils/chatAccess');

const getChatMessages = async (req, res) => {
  const { applicationId } = req.params;

  await ensureChatAccess({ applicationId, user: req.user });

  const messages = await Message.find({ application_id: applicationId })
    .populate('sender_id', 'role profile.fullName')
    .sort({ createdAt: 1 });

  return res.json({ messages });
};

module.exports = {
  getChatMessages
};
