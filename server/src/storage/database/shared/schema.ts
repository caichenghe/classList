import { sql } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar, text, integer, index } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

/** 教师表 */
export const teachers = pgTable(
  "teachers",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 100 }),
    bio: text("bio"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("teachers_name_idx").on(table.name)]
);

/** 学生表 */
export const students = pgTable(
  "students",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 100 }),
    parent_name: varchar("parent_name", { length: 50 }),
    level: varchar("level", { length: 20 }), // 初学者/中级/高级
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("students_name_idx").on(table.name)]
);

/** 课程类型表 */
export const courses = pgTable(
  "courses",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    duration_minutes: integer("duration_minutes").notNull().default(60),
    color: varchar("color", { length: 7 }).notNull().default("#8B5CF6"), // 用于日历标签颜色
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("courses_name_idx").on(table.name)]
);

/** 排课表 */
export const schedules = pgTable(
  "schedules",
  {
    id: serial().primaryKey(),
    teacher_id: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
    student_id: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    course_id: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    start_time: varchar("start_time", { length: 5 }).notNull(), // HH:mm
    end_time: varchar("end_time", { length: 5 }).notNull(), // HH:mm
    status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled / completed / cancelled
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("schedules_teacher_id_idx").on(table.teacher_id),
    index("schedules_student_id_idx").on(table.student_id),
    index("schedules_course_id_idx").on(table.course_id),
    index("schedules_date_idx").on(table.date),
    index("schedules_status_idx").on(table.status),
    index("schedules_teacher_date_idx").on(table.teacher_id, table.date),
  ]
);