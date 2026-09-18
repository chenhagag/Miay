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

    // Get all users in household
    const users = await prisma.user.findMany({
      where: { householdId },
      select: { id: true, name: true, avatarColor: true, avatar: true },
    });

    // Get all tasks in household
    const tasks = await prisma.task.findMany({
      where: { householdId },
    });

    const dayOfWeek = targetDate.getDay();

    // Determine which tasks apply to the period
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

    // Check if a task is assigned to a user on a given day (considering split assignment)
    function taskAssignedToUserOnDay(task, userId, day) {
      const dow = day.getDay();
      // Primary assignee
      if (task.assigneeId === userId) {
        // If assigneeDays is set and non-empty, only count on those days
        if (task.assigneeDays && task.assigneeDays.length > 0) {
          return task.assigneeDays.includes(dow);
        }
        // If no split (no secondAssigneeId), always count
        if (!task.secondAssigneeId) return true;
        // If split but no assigneeDays specified, always count
        return true;
      }
      // Second assignee
      if (task.secondAssigneeId === userId) {
        if (task.secondAssigneeDays && task.secondAssigneeDays.length > 0) {
          return task.secondAssigneeDays.includes(dow);
        }
        return true;
      }
      return false;
    }

    const result = users.map((user) => {
      let relevantTasks;

      if (period === "daily") {
        relevantTasks = tasks.filter(
          (t) => taskAssignedToUserOnDay(t, user.id, targetDate) && taskAppliesToDay(t, targetDate)
        );
      } else if (period === "weekly") {
        // Get all days in the week
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const taskSet = new Set();
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          tasks
            .filter((t) => taskAssignedToUserOnDay(t, user.id, day) && taskAppliesToDay(t, day))
            .forEach((t) => {
              const key = `${t.id}_${day.toISOString().slice(0, 10)}`;
              taskSet.add(key + "|" + t.weight);
            });
        }
        const totalWeight = [...taskSet].reduce((sum, entry) => {
          const w = parseInt(entry.split("|")[1], 10);
          return sum + w;
        }, 0);

        return {
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          avatar: user.avatar,
          totalWeight,
          taskCount: taskSet.size,
        };
      } else if (period === "monthly") {
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();

        const taskSet = new Set();
        for (let i = 0; i < daysInMonth; i++) {
          const day = new Date(monthStart);
          day.setDate(monthStart.getDate() + i);
          tasks
            .filter((t) => taskAssignedToUserOnDay(t, user.id, day) && taskAppliesToDay(t, day))
            .forEach((t) => {
              const key = `${t.id}_${day.toISOString().slice(0, 10)}`;
              taskSet.add(key + "|" + t.weight);
            });
        }
        const totalWeight = [...taskSet].reduce((sum, entry) => {
          const w = parseInt(entry.split("|")[1], 10);
          return sum + w;
        }, 0);

        return {
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          avatar: user.avatar,
          totalWeight,
          taskCount: taskSet.size,
        };
      }

      // Daily case falls through here
      if (!relevantTasks) relevantTasks = [];
      const totalWeight = relevantTasks.reduce((sum, t) => sum + t.weight, 0);

      return {
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        avatar: user.avatar,
        totalWeight,
        taskCount: relevantTasks.length,
      };
    });

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
