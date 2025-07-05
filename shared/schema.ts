import { pgTable, text, serial, integer, boolean, timestamp, uuid, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adminId: integer("admin_id").references(() => users.id),
  planType: text("plan_type").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users (HR/Admin users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"), // GSM nummer voor SMS updates
  department: text("department").notNull(),
  position: text("position"), // Job titel/functie
  manager: text("manager"), // Leidinggevende
  employeeNumber: text("employee_number"), // Personeelsnummer
  address: text("address"), // Adres
  emergencyContact: text("emergency_contact"), // Noodcontact
  emergencyPhone: text("emergency_phone"), // Noodcontact telefoon
  nfcToken: text("nfc_token").notNull().unique(),
  companyId: integer("company_id").references(() => companies.id),
  birthday: timestamp("birthday"),
  hireDate: timestamp("hire_date"),
  lastActive: timestamp("last_active"),
  isActive: boolean("is_active").default(true), // Actief/inactief status
  notificationPreferences: json("notification_preferences").default({
    sms: true,
    email: true,
    push: true
  }), // Communicatie voorkeuren
  // Automatische trigger instellingen
  birthdayNotificationsEnabled: boolean("birthday_notifications_enabled").default(true),
  anniversaryNotificationsEnabled: boolean("anniversary_notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Media items (photos, videos, documents)
export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'photo', 'video', 'document'
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  tags: text("tags").array(),
  companyId: integer("company_id").references(() => companies.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeline items (content assigned to employees)
export const timelineItems = pgTable("timeline_items", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  mediaId: integer("media_id").references(() => mediaItems.id),
  templateId: integer("template_id").references(() => templates.id),
  title: text("title"),
  content: text("content"),
  message: text("message"),
  isVisible: boolean("is_visible").default(true),
  metadata: text("metadata"), // JSON string for additional data
  fromUserId: integer("from_user_id").references(() => users.id),
  type: text("type").notNull(), // 'birthday', 'achievement', 'general', 'compliment'
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliments (peer-to-peer appreciation)
export const compliments = pgTable("compliments", {
  id: serial("id").primaryKey(),
  fromEmployeeId: integer("from_employee_id").references(() => employees.id),
  toEmployeeId: integer("to_employee_id").references(() => employees.id),
  message: text("message").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Templates (advanced content builder with blocks)
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  blocks: json("blocks").default([]), // Content blocks with drag-drop structure
  tags: text("tags").array().default([]), // Tags for organization and filtering
  filePath: text("file_path"), // Path to uploaded template file
  fileType: text("file_type"), // Type of file (image/pdf)
  isActive: boolean("is_active").default(true),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Triggers (automated content scheduling)
export const triggers = pgTable("triggers", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  triggerType: text("trigger_type").notNull(), // 'birthday', 'anniversary', 'custom'
  triggerDate: timestamp("trigger_date").notNull(),
  templateId: integer("template_id").references(() => templates.id),
  isActive: boolean("is_active").default(true),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Employee Events (voor wederkerende momenten zoals jubilea)
export const employeeEvents = pgTable("employee_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "5 jaar dienst", "Promotie naar manager", etc.
  description: text("description"),
  eventDate: timestamp("event_date").notNull(), // Datum van de gebeurtenis
  isRecurring: boolean("is_recurring").default(true), // Jaarlijks herhalen
  reminderDaysBefore: integer("reminder_days_before").default(0), // Dagen voor reminder
  templateId: integer("template_id").references(() => templates.id), // Gekoppelde template
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics (usage tracking)
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  actionType: text("action_type").notNull(), // 'timeline_view', 'compliment_sent', 'media_viewed'
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Openings for referral system
export const jobOpenings = pgTable("job_openings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  requirements: text("requirements").array(),
  benefits: text("benefits").array(),
  salaryRange: text("salary_range"),
  bonusAmount: integer("bonus_amount").default(0),
  filePath: text("file_path"), // PDF attachment path
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals made by employees
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobOpenings.id),
  referredBy: integer("referred_by").references(() => employees.id),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  candidatePhone: text("candidate_phone"),
  candidateLinkedin: text("candidate_linkedin"),
  candidateResume: text("candidate_resume"), // file path
  personalNote: text("personal_note"),
  status: text("status").notNull().default("pending"), // 'pending', 'reviewing', 'interviewed', 'hired', 'rejected'
  bonusAmount: integer("bonus_amount").default(0),
  bonusPaid: boolean("bonus_paid").default(false),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral program settings
export const referralSettings = pgTable("referral_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  bonusAmount: integer("bonus_amount").notNull().default(1000), // in euros
  bonusOnHire: boolean("bonus_on_hire").notNull().default(true),
  bonusOnInterview: boolean("bonus_on_interview").notNull().default(false),
  interviewBonusAmount: integer("interview_bonus_amount").default(250),
  maxReferralsPerEmployee: integer("max_referrals_per_employee").default(10),
  isActive: boolean("is_active").notNull().default(true),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const mfaCodes = pgTable("mfa_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  code: text("code").notNull(),
  type: text("type").notNull(), // 'email' or 'sms'
  purpose: text("purpose").notNull(), // 'login' or 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaMethod: text("mfa_method"), // 'email' or 'sms'
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const companiesRelations = relations(companies, ({ many, one }) => ({
  employees: many(employees),
  users: many(users),
  mediaItems: many(mediaItems),
  templates: many(templates),
  jobOpenings: many(jobOpenings),
  referrals: many(referrals),
  referralSettings: one(referralSettings),
  admin: one(users, { fields: [companies.adminId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  uploadedMedia: many(mediaItems),
  timelineItems: many(timelineItems),
  createdJobs: many(jobOpenings),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, { fields: [employees.companyId], references: [companies.id] }),
  timelineItems: many(timelineItems),
  sentCompliments: many(compliments, { relationName: "sentCompliments" }),
  receivedCompliments: many(compliments, { relationName: "receivedCompliments" }),
  triggers: many(triggers),
  employeeEvents: many(employeeEvents),
  analytics: many(analytics),
  referrals: many(referrals),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one, many }) => ({
  company: one(companies, { fields: [mediaItems.companyId], references: [companies.id] }),
  uploadedBy: one(users, { fields: [mediaItems.uploadedBy], references: [users.id] }),
  timelineItems: many(timelineItems),
}));

export const timelineItemsRelations = relations(timelineItems, ({ one }) => ({
  employee: one(employees, { fields: [timelineItems.employeeId], references: [employees.id] }),
  media: one(mediaItems, { fields: [timelineItems.mediaId], references: [mediaItems.id] }),
  template: one(templates, { fields: [timelineItems.templateId], references: [templates.id] }),
  fromUser: one(users, { fields: [timelineItems.fromUserId], references: [users.id] }),
}));

export const complimentsRelations = relations(compliments, ({ one }) => ({
  fromEmployee: one(employees, { fields: [compliments.fromEmployeeId], references: [employees.id], relationName: "sentCompliments" }),
  toEmployee: one(employees, { fields: [compliments.toEmployeeId], references: [employees.id], relationName: "receivedCompliments" }),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  company: one(companies, { fields: [templates.companyId], references: [companies.id] }),
  triggers: many(triggers),
}));

export const triggersRelations = relations(triggers, ({ one }) => ({
  employee: one(employees, { fields: [triggers.employeeId], references: [employees.id] }),
  template: one(templates, { fields: [triggers.templateId], references: [templates.id] }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  employee: one(employees, { fields: [analytics.employeeId], references: [employees.id] }),
}));

export const jobOpeningsRelations = relations(jobOpenings, ({ one, many }) => ({
  company: one(companies, { fields: [jobOpenings.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [jobOpenings.createdBy], references: [users.id] }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  job: one(jobOpenings, { fields: [referrals.jobId], references: [jobOpenings.id] }),
  referredBy: one(employees, { fields: [referrals.referredBy], references: [employees.id] }),
  company: one(companies, { fields: [referrals.companyId], references: [companies.id] }),
}));

export const referralSettingsRelations = relations(referralSettings, ({ one }) => ({
  company: one(companies, { fields: [referralSettings.companyId], references: [companies.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const mfaCodesRelations = relations(mfaCodes, ({ one }) => ({
  user: one(users, { fields: [mfaCodes.userId], references: [users.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

export const employeeEventsRelations = relations(employeeEvents, ({ one }) => ({
  employee: one(employees, { fields: [employeeEvents.employeeId], references: [employees.id] }),
  template: one(templates, { fields: [employeeEvents.templateId], references: [templates.id] }),
  company: one(companies, { fields: [employeeEvents.companyId], references: [companies.id] }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, nfcToken: true });
export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({ id: true, createdAt: true });
export const insertTimelineItemSchema = createInsertSchema(timelineItems).omit({ id: true, createdAt: true });
export const insertComplimentSchema = createInsertSchema(compliments).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertTriggerSchema = createInsertSchema(triggers).omit({ id: true, createdAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, createdAt: true });
export const insertJobOpeningSchema = createInsertSchema(jobOpenings).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReferralSettingsSchema = createInsertSchema(referralSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertMfaCodeSchema = createInsertSchema(mfaCodes).omit({ id: true, createdAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployeeEventSchema = createInsertSchema(employeeEvents).omit({ id: true, createdAt: true });

// Types
export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type MediaItem = typeof mediaItems.$inferSelect;
export type TimelineItem = typeof timelineItems.$inferSelect;
export type Compliment = typeof compliments.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Trigger = typeof triggers.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
export type JobOpening = typeof jobOpenings.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ReferralSettings = typeof referralSettings.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type MfaCode = typeof mfaCodes.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type EmployeeEvent = typeof employeeEvents.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type InsertTimelineItem = z.infer<typeof insertTimelineItemSchema>;
export type InsertCompliment = z.infer<typeof insertComplimentSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type InsertJobOpening = z.infer<typeof insertJobOpeningSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertReferralSettings = z.infer<typeof insertReferralSettingsSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertMfaCode = z.infer<typeof insertMfaCodeSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertEmployeeEvent = z.infer<typeof insertEmployeeEventSchema>;
