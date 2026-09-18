import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// All routes require auth
router.use(auth);

const assigneeSelect = { select: { id: true, name: true, avatarColor: true, avatar: true } };

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const { assignee, type, date, category, view } = req.query;
    const householdId = req.user.householdId;

    const where = { householdId };

    // Category filter
    if (category) {
      where.category = category;
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Assignee filter - include tasks where either assigneeId or secondAssigneeId matches
    if (assignee && assignee !== "all") {
      if (assignee === "unassigned") {
        where.assigneeId = null;
      } else {
        where.OR = [
          ...(where.OR || []),
          { assigneeId: assignee },
          { secondAssigneeId: assignee },
        ];
      }
    }

    // Date-based view filtering
    if (view === "daily" && date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0=Sunday

      // Build OR conditions for different task types that apply to this day
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dateOrConditions = [
        // Recurring daily tasks
        { type: "RECURRING", recurrence: "DAILY" },
        // Recurring weekly tasks where the day matches
        { type: "RECURRING", recurrence: "WEEKLY", recurrenceDays: { has: dayOfWeek } },
        // Recurring monthly tasks
        { type: "RECURRING", recurrence: "MONTHLY" },
        // One-time tasks scheduled for this date
        {
          type: "ONE_TIME",
          scheduledDate: { gte: dateStart, lte: dateEnd },
        },
        // Unscheduled tasks
        { type: "UNSCHEDULED" },
      ];

      // If we already have OR conditions from assignee filter, combine with AND
      if (where.OR) {
        const assigneeOr = where.OR;
        delete where.OR;
        where.AND = [
          { OR: assigneeOr },
          { OR: dateOrConditions },
        ];
      } else {
        where.OR = dateOrConditions;
      }
    } else if (view === "weekly" && date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      // Get start of week (Sunday)
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const dateOrConditions = [
        { type: "RECURRING" },
        {
          type: "ONE_TIME",
          scheduledDate: { gte: weekStart, lte: weekEnd },
        },
        { type: "UNSCHEDULED" },
      ];

      if (where.OR) {
        const assigneeOr = where.OR;
        delete where.OR;
        where.AND = [
          { OR: assigneeOr },
          { OR: dateOrConditions },
        ];
      } else {
        where.OR = dateOrConditions;
      }
    } else if (view === "monthly" && date) {
      const targetDate = new Date(date);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const dateOrConditions = [
        { type: "RECURRING" },
        {
          type: "ONE_TIME",
          scheduledDate: { gte: monthStart, lte: monthEnd },
        },
        { type: "UNSCHEDULED" },
      ];

      if (where.OR) {
        const assigneeOr = where.OR;
        delete where.OR;
        where.AND = [
          { OR: assigneeOr },
          { OR: dateOrConditions },
        ];
      } else {
        where.OR = dateOrConditions;
      }
    }

    let tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: assigneeSelect,
        secondAssignee: assigneeSelect,
        createdBy: { select: { id: true, name: true } },
        completions: true,
      },
      orderBy: [{ timeSpecific: "desc" }, { startTime: "asc" }, { createdAt: "asc" }],
    });

    // Post-query filter: if viewing by day and filtering by a specific assignee,
    // check assigneeDays/secondAssigneeDays to exclude tasks not meant for this day
    if (view === "daily" && date && assignee && assignee !== "all" && assignee !== "unassigned") {
      const targetDate = new Date(date);
      const dow = targetDate.getDay();

      tasks = tasks.filter((task) => {
        // Check if this user is the primary assignee
        if (task.assigneeId === assignee) {
          // If assigneeDays is set (split assignment), only show on those days
          if (task.assigneeDays && task.assigneeDays.length > 0) {
            return task.assigneeDays.includes(dow);
          }
          return true;
        }
        // Check if this user is the secondary assignee
        if (task.secondAssigneeId === assignee) {
          if (task.secondAssigneeDays && task.secondAssigneeDays.length > 0) {
            return task.secondAssigneeDays.includes(dow);
          }
          return true;
        }
        // Unassigned tasks pass through
        if (!task.assigneeId) return true;
        return true;
      });
    }

    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      assigneeId,
      secondAssigneeId,
      assigneeDays,
      secondAssigneeDays,
      type,
      recurrence,
      recurrenceDays,
      scheduledDate,
      timeSpecific,
      startTime,
      endTime,
      weight,
      category,
    } = req.body;

    const task = await prisma.task.create({
      data: {
        householdId: req.user.householdId,
        title,
        description: description || null,
        assigneeId: assigneeId || null,
        secondAssigneeId: secondAssigneeId || null,
        assigneeDays: assigneeDays || [],
        secondAssigneeDays: secondAssigneeDays || [],
        createdById: req.user.id,
        type: type || "UNSCHEDULED",
        recurrence: recurrence || null,
        recurrenceDays: recurrenceDays || [],
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        timeSpecific: timeSpecific || false,
        startTime: startTime || null,
        endTime: endTime || null,
        weight: weight ?? 2,
        category: category || "general",
      },
      include: {
        assignee: assigneeSelect,
        secondAssignee: assigneeSelect,
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json(task);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify task belongs to household
    const existing = await prisma.task.findFirst({
      where: { id, householdId: req.user.householdId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    const {
      title,
      description,
      assigneeId,
      secondAssigneeId,
      assigneeDays,
      secondAssigneeDays,
      type,
      recurrence,
      recurrenceDays,
      scheduledDate,
      timeSpecific,
      startTime,
      endTime,
      weight,
      category,
      isCompleted,
    } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (secondAssigneeId !== undefined) data.secondAssigneeId = secondAssigneeId || null;
    if (assigneeDays !== undefined) data.assigneeDays = assigneeDays;
    if (secondAssigneeDays !== undefined) data.secondAssigneeDays = secondAssigneeDays;
    if (type !== undefined) data.type = type;
    if (recurrence !== undefined) data.recurrence = recurrence || null;
    if (recurrenceDays !== undefined) data.recurrenceDays = recurrenceDays;
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (timeSpecific !== undefined) data.timeSpecific = timeSpecific;
    if (startTime !== undefined) data.startTime = startTime || null;
    if (endTime !== undefined) data.endTime = endTime || null;
    if (weight !== undefined) data.weight = weight;
    if (category !== undefined) data.category = category;
    if (isCompleted !== undefined) {
      data.isCompleted = isCompleted;
      data.completedAt = isCompleted ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: assigneeSelect,
        secondAssignee: assigneeSelect,
        createdBy: { select: { id: true, name: true } },
        completions: true,
      },
    });

    res.json(task);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id, householdId: req.user.householdId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// POST /api/tasks/:id/complete
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, householdId: req.user.householdId },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.type === "RECURRING") {
      // For recurring tasks, create a completion record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.taskCompletion.upsert({
        where: {
          taskId_completedById_completedDate: {
            taskId: id,
            completedById: req.user.id,
            completedDate: today,
          },
        },
        create: {
          taskId: id,
          completedById: req.user.id,
          completedDate: today,
        },
        update: {},
      });
    } else {
      // For non-recurring tasks, mark as completed
      await prisma.task.update({
        where: { id },
        data: { isCompleted: true, completedAt: new Date() },
      });
    }

    const updated = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: assigneeSelect,
        secondAssignee: assigneeSelect,
        createdBy: { select: { id: true, name: true } },
        completions: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Complete task error:", err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// POST /api/tasks/:id/uncomplete
router.post("/:id/uncomplete", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, householdId: req.user.householdId },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.type === "RECURRING") {
      // Remove today's completion record
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.taskCompletion.deleteMany({
        where: {
          taskId: id,
          completedById: req.user.id,
          completedDate: today,
        },
      });
    } else {
      await prisma.task.update({
        where: { id },
        data: { isCompleted: false, completedAt: null },
      });
    }

    const updated = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: assigneeSelect,
        secondAssignee: assigneeSelect,
        createdBy: { select: { id: true, name: true } },
        completions: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Uncomplete task error:", err);
    res.status(500).json({ error: "Failed to uncomplete task" });
  }
});

export default router;
