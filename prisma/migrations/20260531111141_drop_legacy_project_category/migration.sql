-- RedefineTables: drop Question.projectName and Question.categoryId
PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "questioner" TEXT NOT NULL,
    "createdDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATETIME NOT NULL,
    "answerText" TEXT,
    "answerer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdById" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Question_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Question" ("id", "projectId", "content", "questioner", "createdDate", "deadline", "answerText", "answerer", "status", "notes", "createdById", "updatedAt")
SELECT "id", "projectId", "content", "questioner", "createdDate", "deadline", "answerText", "answerer", "status", "notes", "createdById", "updatedAt"
FROM "Question";

DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";

CREATE INDEX "Question_status_idx" ON "Question"("status");
CREATE INDEX "Question_deadline_idx" ON "Question"("deadline");
CREATE INDEX "Question_projectId_idx" ON "Question"("projectId");

PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = OFF;
