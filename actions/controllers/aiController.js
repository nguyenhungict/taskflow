const { GoogleGenerativeAI } = require("@google/generative-ai");
const Task = require("../models/Task");
const Project = require("../models/Project");

/**
 * @desc    Chat with AI about tasks
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = req.user.id;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "Gemini API Key is not configured in the backend."
            });
        }

        // Initialize fresh for every request to ensure .env changes are picked up
        console.log(`[AI] Checking tasks for user: ${req.user.username} (Key prefix: ${apiKey.substring(0, 5)}...)`);
        const genAI = new GoogleGenerativeAI(apiKey);

        // 1. Fetch user context (Tasks and Projects)
        const tasks = await Task.find({
            $or: [
                { assignee: userId },
                { createdBy: userId }
            ]
        }).populate('project', 'name');

        const projects = await Project.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        });

        // 2. Prepare context summary for AI (OPTIMIZED for tokens)
        const taskSummary = tasks.map(t =>
            `- ${t.title} [${t.status}] (${t.priority}) | Dự án: ${t.project?.name || 'N/A'} | Hạn: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Không'}`
        ).join('\n');

        const systemPrompt = `
      You are TaskFlow AI, a helpful project management assistant. 
      You help users manage their tasks and projects within the TaskFlow application.
      
      User's Current State:
      - Username: ${req.user.username}
      - Total Tasks: ${tasks.length}
      - Projects: ${projects.map(p => p.name).join(', ')}
      
      Danh sách tasks của người dùng:
      ${taskSummary}
      
      Instructions:
      1. Answer questions accurately based on the task data provided.
      2. If asked about "high priority" tasks, list them clearly.
      3. If asked about "expiring" or "overdue" tasks, check the due dates against today (${new Date().toLocaleDateString()}).
      4. Be professional, concise, and encouraging.
      5. Use Markdown for formatting (bolding, lists).
      6. If you don't know the answer or it's not in the data, just say you don't have information on that.
    `;

        // 3. Call Gemini (Using LITE model for better quota management)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt
        });

        // Convert and filter history for Gemini format
        // Gemini MUST start with 'user' and alternate roles
        let formattedHistory = [];
        if (history && history.length > 0) {
            // Find first user message
            const firstUserIdx = history.findIndex(h => h.role === 'user');
            if (firstUserIdx !== -1) {
                formattedHistory = history.slice(firstUserIdx).map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }],
                }));
            }
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            success: true,
            message: text
        });
    } catch (error) {
        console.error("AI Chat Error Details:", {
            message: error.message,
            status: error.status,
            details: error.errorDetails,
        });

        let errorMsg;
        const msg = error.message || "";

        if (msg.includes("API_KEY_INVALID") || msg.includes("API key expired")) {
            errorMsg = "⚠️ API Key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ Admin để cập nhật Key mới.";
        } else if (error.status === 429 || msg.includes("Too Many Requests") || msg.includes("Quota exceeded")) {
            const retryInfo = error.errorDetails?.find(d => d.retryDelay);
            const delay = retryInfo?.retryDelay || "vài phút";
            if (msg.includes("limit: 0")) {
                errorMsg = `⏳ Hạn mức API hôm nay đã hết. Vui lòng thử lại vào ngày mai hoặc liên hệ Admin để tạo Project API mới.`;
            } else {
                errorMsg = `⏳ Đang bị giới hạn tốc độ. Vui lòng chờ ${delay} và thử lại.`;
            }
        } else if (msg.includes("fetch failed")) {
            errorMsg = "🌐 Không thể kết nối tới AI. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } else {
            errorMsg = "❌ Trợ lý AI tạm thời không khả dụng. Vui lòng thử lại sau.";
        }

        res.status(500).json({ success: false, message: errorMsg });
    }
};

module.exports = {
    chatWithAI
};
