import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedHousehold(householdId, numChildren = 0) {
  const tasks = [];

  // Category: dishes
  tasks.push({
    householdId,
    title: "שטיפת כלים",
    category: "dishes",
    type: "RECURRING",
    recurrence: "DAILY",
    weight: 2,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "סידור מדיח",
    category: "dishes",
    type: "RECURRING",
    recurrence: "DAILY",
    weight: 1,
    isPreloaded: true,
  });

  // Category: laundry
  tasks.push({
    householdId,
    title: "כביסה - הכנסה למכונה",
    category: "laundry",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [0, 3], // Sunday and Wednesday
    weight: 2,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "כביסה - קיפול וסידור",
    category: "laundry",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [1, 4], // Monday and Thursday
    weight: 2,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "תליית כביסה",
    category: "laundry",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [0, 3], // Sunday and Wednesday
    weight: 1,
    isPreloaded: true,
  });

  // Category: cleaning
  tasks.push({
    householdId,
    title: "שאיבת אבק",
    category: "cleaning",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [5], // Friday
    weight: 3,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "שטיפת רצפות",
    category: "cleaning",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [5], // Friday
    weight: 3,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "ניקוי חדרי שירותים",
    category: "cleaning",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [4], // Thursday
    weight: 3,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "סידור סלון",
    category: "cleaning",
    type: "RECURRING",
    recurrence: "DAILY",
    weight: 1,
    isPreloaded: true,
  });

  // Category: cooking
  tasks.push({
    householdId,
    title: "בישול ארוחת ערב",
    category: "cooking",
    type: "RECURRING",
    recurrence: "DAILY",
    weight: 4,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "הכנת ארוחות צהריים",
    category: "cooking",
    type: "RECURRING",
    recurrence: "DAILY",
    weight: 3,
    isPreloaded: true,
  });

  // Category: kids (only if numChildren > 0)
  if (numChildren > 0) {
    tasks.push({
      householdId,
      title: "שגרת בוקר ילדים",
      category: "kids",
      type: "RECURRING",
      recurrence: "DAILY",
      timeSpecific: true,
      startTime: "06:30",
      endTime: "08:00",
      weight: 3,
      isPreloaded: true,
    });
    tasks.push({
      householdId,
      title: "איסוף ילדים",
      category: "kids",
      type: "RECURRING",
      recurrence: "DAILY",
      timeSpecific: true,
      startTime: "16:00",
      endTime: "16:30",
      weight: 2,
      isPreloaded: true,
    });
    tasks.push({
      householdId,
      title: 'טיפול בילדים אחה"צ',
      category: "kids",
      type: "RECURRING",
      recurrence: "DAILY",
      timeSpecific: true,
      startTime: "16:30",
      endTime: "19:00",
      weight: 4,
      isPreloaded: true,
    });
    tasks.push({
      householdId,
      title: "שגרת שינה",
      category: "kids",
      type: "RECURRING",
      recurrence: "DAILY",
      timeSpecific: true,
      startTime: "19:00",
      endTime: "20:30",
      weight: 3,
      isPreloaded: true,
    });
    tasks.push({
      householdId,
      title: "אמבטיה לילדים",
      category: "kids",
      type: "RECURRING",
      recurrence: "DAILY",
      weight: 2,
      isPreloaded: true,
    });
  }

  // Category: errands
  tasks.push({
    householdId,
    title: "קניות מכולת",
    category: "errands",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [5], // Friday
    weight: 3,
    isPreloaded: true,
  });
  tasks.push({
    householdId,
    title: "הוצאת זבל",
    category: "errands",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [1, 4], // Monday and Thursday
    weight: 1,
    isPreloaded: true,
  });

  // Category: garden
  tasks.push({
    householdId,
    title: "השקיית עציצים",
    category: "garden",
    type: "RECURRING",
    recurrence: "WEEKLY",
    recurrenceDays: [2], // Tuesday
    weight: 1,
    isPreloaded: true,
  });

  // Create all tasks
  await prisma.task.createMany({ data: tasks });

  console.log(`Seeded ${tasks.length} preloaded tasks for household ${householdId}`);
}

// Allow running as standalone script
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").replace(/^\//, ""));
if (isMainModule || process.argv[1]?.includes("seed.js")) {
  const householdId = process.argv[2];
  const numChildren = parseInt(process.argv[3] || "0", 10);

  if (!householdId) {
    console.error("Usage: node prisma/seed.js <householdId> [numChildren]");
    process.exit(1);
  }

  seedHousehold(householdId, numChildren)
    .then(() => {
      console.log("Seed complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
