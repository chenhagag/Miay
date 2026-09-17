import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import auth from "../middleware/auth.js";
import { seedHousehold } from "../../prisma/seed.js";

const router = Router();
const prisma = new PrismaClient();

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      householdId: user.householdId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// POST /api/auth/setup - Create household + 2 users
router.post("/setup", async (req, res) => {
  try {
    const { householdName, numChildren, user1, user2 } = req.body;

    // Check if emails already exist
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { in: [user1.email, user2.email] },
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hash1 = await bcrypt.hash(user1.password, 10);
    const hash2 = await bcrypt.hash(user2.password, 10);

    // Create household and both users in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          name: householdName,
          numChildren: numChildren || 0,
        },
      });

      const createdUser1 = await tx.user.create({
        data: {
          householdId: household.id,
          name: user1.name,
          email: user1.email,
          passwordHash: hash1,
          avatarColor: "#6366f1",
        },
      });

      const createdUser2 = await tx.user.create({
        data: {
          householdId: household.id,
          name: user2.name,
          email: user2.email,
          passwordHash: hash2,
          avatarColor: "#ec4899",
        },
      });

      return { household, user1: createdUser1, user2: createdUser2 };
    });

    // Seed preloaded tasks for the household
    await seedHousehold(result.household.id, numChildren || 0);

    const token = generateToken(result.user1);

    res.json({
      token,
      user: {
        id: result.user1.id,
        name: result.user1.name,
        email: result.user1.email,
        householdId: result.user1.householdId,
        avatarColor: result.user1.avatarColor,
      },
    });
  } catch (err) {
    console.error("Setup error:", err);
    res.status(500).json({ error: "Failed to create household" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        householdId: user.householdId,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me - Get current user + partner
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { household: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const partner = await prisma.user.findFirst({
      where: {
        householdId: user.householdId,
        id: { not: user.id },
      },
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        householdId: user.householdId,
        avatarColor: user.avatarColor,
        household: {
          id: user.household.id,
          name: user.household.name,
          numChildren: user.household.numChildren,
        },
      },
      partner: partner
        ? {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            avatarColor: partner.avatarColor,
          }
        : null,
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
