import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.use(auth);

const assigneeSelect = { select: { id: true, name: true, avatarColor: true, avatar: true } };

function buildSystemPrompt(tasks, users) {
  const taskList = tasks
    .map((t) => {
      const assignee = t.assignee ? t.assignee.name : "לא משויך";
      const secondAssignee = t.secondAssignee ? t.secondAssignee.name : "אין";
      const splitInfo = t.secondAssigneeId
        ? `, שותף/ה שני/ה: ${secondAssignee}, ימים ראשיים: [${t.assigneeDays.join(",")}], ימים שניים: [${t.secondAssigneeDays.join(",")}]`
        : "";
      return `- "${t.title}" (${t.category}, משויך ל: ${assignee}${splitInfo}, סוג: ${t.type}, id: ${t.id})`;
    })
    .join("\n");

  const userList = users.map((u) => `- ${u.name} (id: ${u.id})`).join("\n");

  return `אתה עוזר לניהול משימות בית. אתה מקבל הודעה בשפה חופשית ועליך להמיר אותה לפעולה מובנית.

המשתמשים במשק הבית:
${userList}

המשימות הקיימות:
${taskList || "אין משימות קיימות"}

עליך להחזיר JSON בלבד (ללא markdown, ללא הסברים נוספים) בפורמט הבא:
{
  "action": "create" | "update" | "delete" | "info",
  "reasoning": "הסבר קצר בעברית למה בחרת בפעולה זו",
  "task": {
    "title": "שם המשימה",
    "description": "תיאור (אופציונלי)",
    "assigneeId": "id של המשתמש הראשי או null",
    "secondAssigneeId": "id של השותף/ה השני/ה או null (לחלוקה בין שתיים)",
    "assigneeDays": [0-6] (ימים שהמשתמש הראשי אחראי, 0=ראשון),
    "secondAssigneeDays": [0-6] (ימים שהשותף/ה השני/ה אחראי/ת),
    "type": "RECURRING" | "ONE_TIME" | "UNSCHEDULED",
    "recurrence": "DAILY" | "WEEKLY" | "MONTHLY" | null,
    "recurrenceDays": [0-6] (0=ראשון),
    "scheduledDate": "YYYY-MM-DD" | null,
    "timeSpecific": true/false,
    "startTime": "HH:MM" | null,
    "endTime": "HH:MM" | null,
    "weight": 1-5,
    "category": "dishes" | "laundry" | "cleaning" | "cooking" | "kids" | "errands" | "garden" | "general"
  },
  "taskId": "id של משימה קיימת (לעדכון או מחיקה)"
}

כללים:
- אם ההודעה מבקשת ליצור משימה חדשה, השתמש ב-action: "create"
- אם ההודעה מבקשת לעדכן משימה קיימת (שינוי שיוך, זמן וכו'), השתמש ב-action: "update" וכלול taskId
- אם ההודעה מבקשת למחוק משימה, השתמש ב-action: "delete" וכלול taskId
- אם ההודעה היא שאלה כללית, השתמש ב-action: "info"
- אם מוזכר שם של משתמש, התאם אותו ל-id הנכון
- אם המשימה כבר קיימת ברשימה, אל תיצור כפילות - עדכן במקום
- קטגוריה: נסה לזהות אוטומטית לפי תוכן המשימה
- אם ההודעה מבקשת לחלק משימה בין שתי השותפות, השתמש ב-secondAssigneeId, assigneeDays ו-secondAssigneeDays`;
}

async function callAI(systemPrompt, userMessage) {
  // Try Anthropic first
  if (process.env.ANTHROPIC_API_KEY) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    return response.content[0].text;
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 1024,
    });

    return response.choices[0].message.content;
  }

  throw new Error("No AI API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
}

// POST /api/ai/parse-task
router.post("/parse-task", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const householdId = req.user.householdId;

    // Fetch existing tasks and users
    const [tasks, users] = await Promise.all([
      prisma.task.findMany({
        where: { householdId },
        include: {
          assignee: { select: { id: true, name: true } },
          secondAssignee: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: { householdId },
        select: { id: true, name: true },
      }),
    ]);

    const systemPrompt = buildSystemPrompt(tasks, users);
    const aiResponse = await callAI(systemPrompt, message);

    // Parse AI response - strip markdown code fences if present
    let parsed;
    try {
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({
        error: "Failed to parse AI response",
        raw: aiResponse,
      });
    }

    let resultTask = null;

    if (parsed.action === "create" && parsed.task) {
      resultTask = await prisma.task.create({
        data: {
          householdId,
          title: parsed.task.title,
          description: parsed.task.description || null,
          assigneeId: parsed.task.assigneeId || null,
          secondAssigneeId: parsed.task.secondAssigneeId || null,
          assigneeDays: parsed.task.assigneeDays || [],
          secondAssigneeDays: parsed.task.secondAssigneeDays || [],
          createdById: req.user.id,
          type: parsed.task.type || "UNSCHEDULED",
          recurrence: parsed.task.recurrence || null,
          recurrenceDays: parsed.task.recurrenceDays || [],
          scheduledDate: parsed.task.scheduledDate
            ? new Date(parsed.task.scheduledDate)
            : null,
          timeSpecific: parsed.task.timeSpecific || false,
          startTime: parsed.task.startTime || null,
          endTime: parsed.task.endTime || null,
          weight: parsed.task.weight ?? 2,
          category: parsed.task.category || "general",
        },
        include: {
          assignee: assigneeSelect,
          secondAssignee: assigneeSelect,
          createdBy: { select: { id: true, name: true } },
        },
      });
    } else if (parsed.action === "update" && parsed.taskId) {
      const existing = await prisma.task.findFirst({
        where: { id: parsed.taskId, householdId },
      });
      if (existing) {
        const updateData = {};
        const t = parsed.task || {};
        if (t.title !== undefined) updateData.title = t.title;
        if (t.description !== undefined) updateData.description = t.description;
        if (t.assigneeId !== undefined) updateData.assigneeId = t.assigneeId || null;
        if (t.secondAssigneeId !== undefined) updateData.secondAssigneeId = t.secondAssigneeId || null;
        if (t.assigneeDays !== undefined) updateData.assigneeDays = t.assigneeDays;
        if (t.secondAssigneeDays !== undefined) updateData.secondAssigneeDays = t.secondAssigneeDays;
        if (t.type !== undefined) updateData.type = t.type;
        if (t.recurrence !== undefined) updateData.recurrence = t.recurrence || null;
        if (t.recurrenceDays !== undefined) updateData.recurrenceDays = t.recurrenceDays;
        if (t.scheduledDate !== undefined)
          updateData.scheduledDate = t.scheduledDate ? new Date(t.scheduledDate) : null;
        if (t.timeSpecific !== undefined) updateData.timeSpecific = t.timeSpecific;
        if (t.startTime !== undefined) updateData.startTime = t.startTime || null;
        if (t.endTime !== undefined) updateData.endTime = t.endTime || null;
        if (t.weight !== undefined) updateData.weight = t.weight;
        if (t.category !== undefined) updateData.category = t.category;

        resultTask = await prisma.task.update({
          where: { id: parsed.taskId },
          data: updateData,
          include: {
            assignee: assigneeSelect,
            secondAssignee: assigneeSelect,
            createdBy: { select: { id: true, name: true } },
          },
        });
      }
    } else if (parsed.action === "delete" && parsed.taskId) {
      const existing = await prisma.task.findFirst({
        where: { id: parsed.taskId, householdId },
      });
      if (existing) {
        resultTask = await prisma.task.delete({
          where: { id: parsed.taskId },
          include: {
            assignee: assigneeSelect,
            secondAssignee: assigneeSelect,
            createdBy: { select: { id: true, name: true } },
          },
        });
      }
    }

    res.json({
      action: parsed.action,
      task: resultTask,
      reasoning: parsed.reasoning || "",
    });
  } catch (err) {
    console.error("AI parse error:", err);
    res.status(500).json({ error: err.message || "AI processing failed" });
  }
});

export default router;
