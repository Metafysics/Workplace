import { 
  companies, users, employees, mediaItems, timelineItems, compliments, templates, triggers, analytics, jobOpenings, referrals, referralSettings, passwordResetTokens, mfaCodes, userSettings, employeeEvents,
  type Company, type User, type Employee, type MediaItem, type TimelineItem, type Compliment, type Template, type Trigger, type Analytics, type JobOpening, type Referral, type ReferralSettings, type PasswordResetToken, type MfaCode, type UserSettings, type EmployeeEvent,
  type InsertCompany, type InsertUser, type InsertEmployee, type InsertMediaItem, type InsertTimelineItem, type InsertCompliment, type InsertTemplate, type InsertTrigger, type InsertAnalytics, type InsertJobOpening, type InsertReferral, type InsertReferralSettings, type InsertPasswordResetToken, type InsertMfaCode, type InsertUserSettings, type InsertEmployeeEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Employee methods
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  createEmployeesBulk(employees: InsertEmployee[]): Promise<{ success: boolean; total: number; imported: number; errors: Array<{ row: number; error: string; data?: any }> }>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByNfcToken(token: string): Promise<Employee | undefined>;
  getEmployeesByCompany(companyId: number): Promise<Employee[]>;
  updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee>;
  regenerateNfcToken(id: number): Promise<Employee>;
  
  // Media methods
  createMediaItem(media: InsertMediaItem): Promise<MediaItem>;
  getMediaItem(id: number): Promise<MediaItem | undefined>;
  getMediaItemsByCompany(companyId: number): Promise<MediaItem[]>;
  updateMediaItem(id: number, updates: Partial<MediaItem>): Promise<MediaItem>;
  deleteMediaItem(id: number): Promise<void>;
  
  // Timeline methods
  createTimelineItem(item: InsertTimelineItem): Promise<TimelineItem>;
  getTimelineItemsByEmployee(employeeId: number): Promise<TimelineItem[]>;
  deleteTimelineItem(id: number): Promise<void>;
  
  // Compliment methods
  createCompliment(compliment: InsertCompliment): Promise<Compliment>;
  getComplimentsByEmployee(employeeId: number): Promise<Compliment[]>;
  getComplimentsByCompany(companyId: number): Promise<Compliment[]>;
  
  // Template methods
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplatesByCompany(companyId: number): Promise<Template[]>;
  updateTemplate(id: number, updates: Partial<Template>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;
  
  // Trigger methods
  createTrigger(trigger: InsertTrigger): Promise<Trigger>;
  getTriggersByEmployee(employeeId: number): Promise<Trigger[]>;
  getActiveTriggers(): Promise<Trigger[]>;
  updateTrigger(id: number, updates: Partial<Trigger>): Promise<Trigger>;
  
  // Analytics methods
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByCompany(companyId: number): Promise<Analytics[]>;
  getDashboardStats(companyId: number): Promise<{
    totalEmployees: number;
    activeTimelines: number;
    complimentsSent: number;
    mediaItems: number;
  }>;

  // Job Opening methods
  createJobOpening(job: InsertJobOpening): Promise<JobOpening>;
  getJobOpening(id: number): Promise<JobOpening | undefined>;
  getJobOpeningsByCompany(companyId: number): Promise<JobOpening[]>;
  updateJobOpening(id: number, updates: Partial<JobOpening>): Promise<JobOpening>;
  deleteJobOpening(id: number): Promise<void>;

  // Referral methods
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferral(id: number): Promise<Referral | undefined>;
  getReferralsByEmployee(employeeId: number): Promise<Referral[]>;
  getReferralsByCompany(companyId: number): Promise<Referral[]>;
  getReferralsByJob(jobId: number): Promise<Referral[]>;
  updateReferralStatus(id: number, status: string, bonusAmount?: number): Promise<Referral>;
  
  // Referral Settings methods
  createReferralSettings(settings: InsertReferralSettings): Promise<ReferralSettings>;
  getReferralSettings(companyId: number): Promise<ReferralSettings | undefined>;
  updateReferralSettings(companyId: number, updates: Partial<ReferralSettings>): Promise<ReferralSettings>;

  // Password Reset methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  
  // MFA methods
  createMfaCode(code: InsertMfaCode): Promise<MfaCode>;
  getMfaCode(code: string, userId: number): Promise<MfaCode | undefined>;
  markMfaCodeAsUsed(code: string): Promise<void>;
  
  // User Settings methods
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings>;

  // Employee Events methods
  createEmployeeEvent(event: InsertEmployeeEvent): Promise<EmployeeEvent>;
  getEmployeeEventsByEmployee(employeeId: number): Promise<EmployeeEvent[]>;
  getEmployeeEventsByCompany(companyId: number): Promise<EmployeeEvent[]>;
  updateEmployeeEvent(id: number, updates: Partial<EmployeeEvent>): Promise<EmployeeEvent>;
  deleteEmployeeEvent(id: number): Promise<void>;
  getUpcomingEvents(companyId: number, daysAhead?: number): Promise<EmployeeEvent[]>;
}

export class DatabaseStorage implements IStorage {
  // Company methods
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }
  
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }
  
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  // Employee methods
  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const nfcToken = `nfc_${nanoid(12)}`;
    const [employee] = await db.insert(employees).values({
      ...insertEmployee,
      nfcToken,
    }).returning();
    return employee;
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }
  
  async getEmployeeByNfcToken(token: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.nfcToken, token));
    return employee || undefined;
  }
  
  async getEmployeesByCompany(companyId: number): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.companyId, companyId));
  }
  
  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    const [employee] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    return employee;
  }
  
  async regenerateNfcToken(id: number): Promise<Employee> {
    const nfcToken = `nfc_${nanoid(12)}`;
    const [employee] = await db.update(employees).set({ nfcToken }).where(eq(employees.id, id)).returning();
    return employee;
  }

  async createEmployeesBulk(employeesToCreate: InsertEmployee[]): Promise<{ success: boolean; total: number; imported: number; errors: Array<{ row: number; error: string; data?: any }> }> {
    const errors: Array<{ row: number; error: string; data?: any }> = [];
    const imported: Employee[] = [];
    const total = employeesToCreate.length;

    for (let i = 0; i < employeesToCreate.length; i++) {
      const employee = employeesToCreate[i];
      const rowNumber = i + 2; // +2 because CSV has header row and we start from 0

      try {
        // Check if email already exists
        const existingEmployee = await db
          .select()
          .from(employees)
          .where(eq(employees.email, employee.email))
          .limit(1);

        if (existingEmployee.length > 0) {
          errors.push({
            row: rowNumber,
            error: `E-mailadres ${employee.email} bestaat al`,
            data: employee
          });
          continue;
        }

        // Create employee with unique NFC token
        const nfcToken = nanoid(16);
        const [newEmployee] = await db
          .insert(employees)
          .values({ 
            ...employee, 
            nfcToken,
            companyId: 1 // Default company ID for now
          })
          .returning();

        imported.push(newEmployee);
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: `Database fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
          data: employee
        });
      }
    }

    return {
      success: errors.length === 0,
      total,
      imported: imported.length,
      errors
    };
  }
  
  // Media methods
  async createMediaItem(insertMedia: InsertMediaItem): Promise<MediaItem> {
    const [media] = await db.insert(mediaItems).values(insertMedia).returning();
    return media;
  }
  
  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    const [media] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    return media || undefined;
  }
  
  async getMediaItemsByCompany(companyId: number): Promise<MediaItem[]> {
    return await db.select().from(mediaItems).where(eq(mediaItems.companyId, companyId)).orderBy(desc(mediaItems.createdAt));
  }
  
  async updateMediaItem(id: number, updates: Partial<MediaItem>): Promise<MediaItem> {
    const [media] = await db.update(mediaItems).set(updates).where(eq(mediaItems.id, id)).returning();
    return media;
  }
  
  async deleteMediaItem(id: number): Promise<void> {
    // First delete related timeline items
    await db.delete(timelineItems).where(eq(timelineItems.mediaId, id));
    // Then delete the media item
    await db.delete(mediaItems).where(eq(mediaItems.id, id));
  }
  
  // Timeline methods
  async createTimelineItem(insertItem: InsertTimelineItem): Promise<TimelineItem> {
    const [item] = await db.insert(timelineItems).values(insertItem).returning();
    return item;
  }
  
  async getTimelineItemsByEmployee(employeeId: number): Promise<TimelineItem[]> {
    // First get the employee to know their company
    const employee = await this.getEmployee(employeeId);
    if (!employee) return [];

    const results = await db
      .select({
        timelineItems,
        media: mediaItems,
        fromUser: users,
        company: companies
      })
      .from(timelineItems)
      .leftJoin(mediaItems, eq(timelineItems.mediaId, mediaItems.id))
      .leftJoin(users, eq(timelineItems.fromUserId, users.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .where(eq(timelineItems.employeeId, employeeId))
      .orderBy(desc(timelineItems.createdAt));

    return results.map(result => ({
      ...result.timelineItems,
      media: result.media ? {
        id: result.media.id,
        title: result.media.title,
        type: result.media.type,
        url: result.media.url
      } : undefined,
      fromUser: result.fromUser ? {
        name: result.company?.name || `${result.fromUser.firstName} ${result.fromUser.lastName}`
      } : undefined
    })) as any;
  }
  
  async deleteTimelineItem(id: number): Promise<void> {
    await db.delete(timelineItems).where(eq(timelineItems.id, id));
  }
  
  // Compliment methods
  async createCompliment(insertCompliment: InsertCompliment): Promise<Compliment> {
    const [compliment] = await db.insert(compliments).values(insertCompliment).returning();
    return compliment;
  }
  
  async getComplimentsByEmployee(employeeId: number): Promise<Compliment[]> {
    return await db.select().from(compliments).where(eq(compliments.toEmployeeId, employeeId)).orderBy(desc(compliments.createdAt));
  }
  
  async getComplimentsByCompany(companyId: number): Promise<Compliment[]> {
    return await db.select()
      .from(compliments)
      .leftJoin(employees, eq(compliments.toEmployeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(compliments.createdAt));
  }
  
  // Template methods
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }
  
  async getTemplatesByCompany(companyId: number): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.companyId, companyId));
  }
  
  async updateTemplate(id: number, updates: Partial<Template>): Promise<Template> {
    const [template] = await db.update(templates).set(updates).where(eq(templates.id, id)).returning();
    return template;
  }
  
  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
  
  // Trigger methods
  async createTrigger(insertTrigger: InsertTrigger): Promise<Trigger> {
    const [trigger] = await db.insert(triggers).values(insertTrigger).returning();
    return trigger;
  }
  
  async getTriggersByEmployee(employeeId: number): Promise<Trigger[]> {
    return await db.select().from(triggers).where(eq(triggers.employeeId, employeeId));
  }
  
  async getActiveTriggers(): Promise<Trigger[]> {
    return await db.select().from(triggers).where(eq(triggers.isActive, true));
  }
  
  async updateTrigger(id: number, updates: Partial<Trigger>): Promise<Trigger> {
    const [trigger] = await db.update(triggers).set(updates).where(eq(triggers.id, id)).returning();
    return trigger;
  }
  
  // Analytics methods
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analyticsResult] = await db.insert(analytics).values(insertAnalytics).returning();
    return analyticsResult;
  }
  
  async getAnalyticsByCompany(companyId: number): Promise<Analytics[]> {
    return await db.select()
      .from(analytics)
      .leftJoin(employees, eq(analytics.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(analytics.createdAt));
  }
  
  async getDashboardStats(companyId: number): Promise<{
    totalEmployees: number;
    activeTimelines: number;
    complimentsSent: number;
    mediaItems: number;
  }> {
    const [totalEmployees] = await db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.companyId, companyId));
    const [activeTimelines] = await db.select({ count: sql<number>`count(distinct ${employees.id})` }).from(employees).leftJoin(timelineItems, eq(employees.id, timelineItems.employeeId)).where(eq(employees.companyId, companyId));
    const [complimentsSent] = await db.select({ count: sql<number>`count(*)` }).from(compliments).leftJoin(employees, eq(compliments.toEmployeeId, employees.id)).where(eq(employees.companyId, companyId));
    const [mediaItemsCount] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems).where(eq(mediaItems.companyId, companyId));
    
    return {
      totalEmployees: totalEmployees.count,
      activeTimelines: activeTimelines.count,
      complimentsSent: complimentsSent.count,
      mediaItems: mediaItemsCount.count,
    };
  }

  // Job Opening methods
  async createJobOpening(insertJob: InsertJobOpening): Promise<JobOpening> {
    const [job] = await db.insert(jobOpenings).values(insertJob).returning();
    return job;
  }

  async getJobOpening(id: number): Promise<JobOpening | undefined> {
    const [job] = await db.select().from(jobOpenings).where(eq(jobOpenings.id, id));
    return job || undefined;
  }

  async getJobOpeningsByCompany(companyId: number): Promise<JobOpening[]> {
    return await db.select().from(jobOpenings).where(eq(jobOpenings.companyId, companyId)).orderBy(desc(jobOpenings.createdAt));
  }

  async updateJobOpening(id: number, updates: Partial<JobOpening>): Promise<JobOpening> {
    const [job] = await db.update(jobOpenings).set(updates).where(eq(jobOpenings.id, id)).returning();
    return job;
  }

  async deleteJobOpening(id: number): Promise<void> {
    await db.delete(jobOpenings).where(eq(jobOpenings.id, id));
  }

  // Referral methods
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  async getReferral(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || undefined;
  }

  async getReferralsByEmployee(employeeId: number): Promise<Referral[]> {
    const results = await db
      .select({
        referral: referrals,
        jobTitle: jobOpenings.title,
      })
      .from(referrals)
      .leftJoin(jobOpenings, eq(referrals.jobId, jobOpenings.id))
      .where(eq(referrals.referredBy, employeeId))
      .orderBy(desc(referrals.createdAt));

    return results.map(result => ({
      ...result.referral,
      jobTitle: result.jobTitle || 'Unknown'
    }));
  }

  async getReferralsByCompany(companyId: number): Promise<Referral[]> {
    const results = await db
      .select({
        referral: referrals,
        jobTitle: jobOpenings.title,
        referrerName: employees.name,
      })
      .from(referrals)
      .leftJoin(jobOpenings, eq(referrals.jobId, jobOpenings.id))
      .leftJoin(employees, eq(referrals.referredBy, employees.id))
      .where(eq(referrals.companyId, companyId))
      .orderBy(desc(referrals.createdAt));

    return results.map(result => ({
      ...result.referral,
      jobTitle: result.jobTitle || 'Unknown',
      referrerName: result.referrerName || 'Unknown'
    }));
  }

  async getReferralsByJob(jobId: number): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.jobId, jobId)).orderBy(desc(referrals.createdAt));
  }

  async updateReferralStatus(id: number, status: string, bonusAmount?: number): Promise<Referral> {
    const updates: any = { status, updatedAt: new Date() };
    if (bonusAmount !== undefined) {
      updates.bonusAmount = bonusAmount;
      if (status === 'hired') {
        updates.bonusPaid = true;
      }
    }
    const [referral] = await db.update(referrals).set(updates).where(eq(referrals.id, id)).returning();
    return referral;
  }

  // Referral Settings methods
  async createReferralSettings(insertSettings: InsertReferralSettings): Promise<ReferralSettings> {
    const [settings] = await db.insert(referralSettings).values(insertSettings).returning();
    return settings;
  }

  async getReferralSettings(companyId: number): Promise<ReferralSettings | undefined> {
    const [settings] = await db.select().from(referralSettings).where(eq(referralSettings.companyId, companyId));
    return settings || undefined;
  }

  async updateReferralSettings(companyId: number, updates: Partial<ReferralSettings>): Promise<ReferralSettings> {
    const settingsUpdates = { ...updates, updatedAt: new Date() };
    const [settings] = await db.update(referralSettings).set(settingsUpdates).where(eq(referralSettings.companyId, companyId)).returning();
    return settings;
  }

  // Password Reset methods
  async createPasswordResetToken(insertToken: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(insertToken).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false)));
    return resetToken || undefined;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // MFA methods
  async createMfaCode(insertCode: InsertMfaCode): Promise<MfaCode> {
    const [code] = await db.insert(mfaCodes).values(insertCode).returning();
    return code;
  }

  async getMfaCode(code: string, userId: number): Promise<MfaCode | undefined> {
    const [mfaCode] = await db.select().from(mfaCodes)
      .where(and(
        eq(mfaCodes.code, code),
        eq(mfaCodes.userId, userId),
        eq(mfaCodes.used, false)
      ));
    return mfaCode || undefined;
  }

  async markMfaCodeAsUsed(code: string): Promise<void> {
    await db.update(mfaCodes)
      .set({ used: true })
      .where(eq(mfaCodes.code, code));
  }

  // User Settings methods
  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings).values(insertSettings).returning();
    return settings;
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    const settingsUpdates = { ...updates, updatedAt: new Date() };
    const [settings] = await db.update(userSettings)
      .set(settingsUpdates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  }

  // Employee Events methods
  async createEmployeeEvent(insertEvent: InsertEmployeeEvent): Promise<EmployeeEvent> {
    const [event] = await db.insert(employeeEvents).values(insertEvent).returning();
    return event;
  }

  async getEmployeeEventsByEmployee(employeeId: number): Promise<EmployeeEvent[]> {
    return await db.select().from(employeeEvents)
      .where(and(eq(employeeEvents.employeeId, employeeId), eq(employeeEvents.isActive, true)))
      .orderBy(desc(employeeEvents.eventDate));
  }

  async getEmployeeEventsByCompany(companyId: number): Promise<EmployeeEvent[]> {
    return await db.select().from(employeeEvents)
      .where(and(eq(employeeEvents.companyId, companyId), eq(employeeEvents.isActive, true)))
      .orderBy(desc(employeeEvents.eventDate));
  }

  async updateEmployeeEvent(id: number, updates: Partial<EmployeeEvent>): Promise<EmployeeEvent> {
    const [event] = await db.update(employeeEvents)
      .set(updates)
      .where(eq(employeeEvents.id, id))
      .returning();
    return event;
  }

  async deleteEmployeeEvent(id: number): Promise<void> {
    await db.update(employeeEvents)
      .set({ isActive: false })
      .where(eq(employeeEvents.id, id));
  }

  async getUpcomingEvents(companyId: number, daysAhead: number = 30): Promise<EmployeeEvent[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return await db.select().from(employeeEvents)
      .where(and(
        eq(employeeEvents.companyId, companyId),
        eq(employeeEvents.isActive, true),
        sql`DATE_PART('month', ${employeeEvents.eventDate}) = DATE_PART('month', CURRENT_DATE) AND DATE_PART('day', ${employeeEvents.eventDate}) >= DATE_PART('day', CURRENT_DATE)`
      ))
      .orderBy(employeeEvents.eventDate);
  }
}

export const storage = new DatabaseStorage();
