import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/dashboard/comparison
router.get("/comparison", async (req, res) => {
  try {
    const { period = "daily", date } = req.query;
    const householdId = req.user.householdId;
    const targetDate = date ? new Date(date) : new Date();

    const users = await prisma.user.findMany({
      where: { householdId },
      select: { id: true, name: true, avatarColor: true, avatar: true },
    });

    const tasks = await prisma.task.findMany({
      where: { householdId },
    });

    function taskAppliesToDay(task, day) {
      const dow = day.getDay();
      if (task.type === "RECURRING") {
        if (task.recurrence === "DAILY") return true;
        if (task.recurrence === "WEEKLY" && task.recurrenceDays.includes(dow)) return true;
        if (task.recurrence === "MONTHLY") return true;
        return false;
      }
      if (task.type === "ONE_TIME" && task.scheduledDate) {
        const sd = new Date(task.scheduledDate);
        return (
          sd.getFullYear() === day.getFullYear() &&
          sd.getMonth() === day.getMonth() &&
          sd.getDate() === day.getDate()
        );
      }
      if (task.type === "UNSCHEDULED") return true;
      return false;
    }

    function taskAssignedToUserOnDay(task, userId, day) {
      const dow = day.getDay();
      if (task.assigneeId === userId) {
        if (task.assigneeDays && task.assigneeDays.length > 0) {
          return task.assigneeDays.includes(dow);
        }
        if (!task.secondAssigneeId) return true;
        return true;
      }
      if (task.secondAssigneeId === userId) {
        if (task.secondAssigneeDays && task.secondAssigneeDays.length > 0) {
          return task.secondAssigneeDays.includes(dow);
        }
        return true;
      }
      return false;
    }

    // Calculate for a range of days
    function calculateForDays(days) {
      return users.map((user) => {
        let totalWeight = 0;
        let totalOccurrences = 0;
        const taskDetails = [];

        for (const day of days) {
          tasks
            .filter((t) => taskAssignedToUserOnDay(t, user.id, day) && taskAppliesToDay(t, day))
            .forEach((t) => {
              totalWeight += t.weight;
              totalOccurrences++;
              // Track unique tasks with their occurrence count
              const existing = taskDetails.find((d) => d.id === t.id);
              if (existing) {
                existing.occurrences++;
                existing.totalWeight += t.weight;
              } else {
                taskDetails.push({
                  id: t.id,
                  title: t.title,
                  weight: t.weight,
                  category: t.category,
                  type: t.type,
                  recurrence: t.recurrence,
                  occurrences: 1,
                  totalWeight: t.weight,
                });
              }
            });
        }

        return {
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          avatar: user.avatar,
          totalWeight,
          taskCount: totalOccurrences,
          uniqueTaskCount: taskDetails.length,
          tasks: taskDetails,
        };
      });
    }

    let result;

    if (period === "daily") {
      result = calculateForDays([targetDate]);
    } else if (period === "weekly") {
      const dayOfWeek = targetDate.getDay();
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
      }
      result = calculateForDays(days);
    } else if (period === "monthly") {
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      const days = [];
      for (let i = 0; i < monthEnd.getDate(); i++) {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() + i);
        days.push(day);
      }
      result = calculateForDays(days);
    }

    res.json({
      users: result,
      period,
      date: targetDate.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error("Comparison error:", err);
    res.status(500).json({ error: "Failed to calculate comparison" });
  }
});

// GET /api/dashboard/unassigned
router.get("/unassigned", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        householdId: req.user.householdId,
        assigneeId: null,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(tasks);
  } catch (err) {
    console.error("Unassigned error:", err);
    res.status(500).json({ error: "Failed to fetch unassigned tasks" });
  }
});

export default router;
