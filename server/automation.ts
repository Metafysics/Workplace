import { storage } from './storage';
import { db } from './db';
import { employees, templates, timelineItems } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface AutomationResult {
  processed: number;
  errors: string[];
}

export class AutomationService {
  /**
   * Process birthday automation triggers
   * Creates timeline items for employees whose birthday is today
   */
  async processBirthdayTriggers(): Promise<AutomationResult> {
    const result: AutomationResult = { processed: 0, errors: [] };
    
    try {
      // Get today's date in MM-DD format
      const today = new Date();
      const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const todayDay = today.getDate().toString().padStart(2, '0');
      
      // Find employees with birthdays today who have notifications enabled
      const employeesWithBirthdays = await db
        .select()
        .from(employees)
        .where(
          and(
            sql`EXTRACT(MONTH FROM birthday) = ${todayMonth}`,
            sql`EXTRACT(DAY FROM birthday) = ${todayDay}`,
            eq(employees.birthdayNotificationsEnabled, true),
            eq(employees.isActive, true)
          )
        );

      for (const employee of employeesWithBirthdays) {
        try {
          // Get birthday templates for this company
          const birthdayTemplates = await db
            .select()
            .from(templates)
            .where(
              and(
                eq(templates.companyId, employee.companyId!),
                sql`tags @> '["birthday"]'`
              )
            );

          if (birthdayTemplates.length === 0) {
            result.errors.push(`No birthday templates found for company ${employee.companyId}`);
            continue;
          }

          // Create timeline items for each birthday template
          for (const template of birthdayTemplates) {
            await storage.createTimelineItem({
              employeeId: employee.id,
              templateId: template.id,
              title: `🎉 Gefeliciteerd ${employee.name}!`,
              content: `Happy Birthday! Vandaag is jouw speciale dag.`,
              type: 'birthday',
              isVisible: true,
              metadata: JSON.stringify({
                automationTrigger: 'birthday',
                templateId: template.id,
                date: today.toISOString()
              })
            });
          }

          result.processed++;
        } catch (error) {
          result.errors.push(`Error processing birthday for employee ${employee.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error processing birthday triggers: ${error}`);
    }

    return result;
  }

  /**
   * Process work anniversary automation triggers
   * Creates timeline items for employees whose work anniversary is today
   */
  async processAnniversaryTriggers(): Promise<AutomationResult> {
    const result: AutomationResult = { processed: 0, errors: [] };
    
    try {
      // Get today's date in MM-DD format
      const today = new Date();
      const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const todayDay = today.getDate().toString().padStart(2, '0');
      
      // Find employees with work anniversaries today who have notifications enabled
      const employeesWithAnniversaries = await db
        .select()
        .from(employees)
        .where(
          and(
            sql`EXTRACT(MONTH FROM hire_date) = ${todayMonth}`,
            sql`EXTRACT(DAY FROM hire_date) = ${todayDay}`,
            sql`hire_date < CURRENT_DATE`, // Must be at least 1 year ago
            eq(employees.anniversaryNotificationsEnabled, true),
            eq(employees.isActive, true)
          )
        );

      for (const employee of employeesWithAnniversaries) {
        try {
          // Calculate years of service
          const hireYear = new Date(employee.hireDate!).getFullYear();
          const currentYear = today.getFullYear();
          const yearsOfService = currentYear - hireYear;

          // Get anniversary templates for this company
          const anniversaryTemplates = await db
            .select()
            .from(templates)
            .where(
              and(
                eq(templates.companyId, employee.companyId!),
                sql`tags @> '["anniversary"]'`
              )
            );

          if (anniversaryTemplates.length === 0) {
            result.errors.push(`No anniversary templates found for company ${employee.companyId}`);
            continue;
          }

          // Create timeline items for each anniversary template
          for (const template of anniversaryTemplates) {
            await storage.createTimelineItem({
              employeeId: employee.id,
              templateId: template.id,
              title: `🏆 ${yearsOfService} jaar bij ons!`,
              content: `Gefeliciteerd ${employee.name}! Vandaag vieren we jouw ${yearsOfService}-jarig jubileum bij het bedrijf.`,
              type: 'anniversary',
              isVisible: true,
              metadata: JSON.stringify({
                automationTrigger: 'anniversary',
                templateId: template.id,
                yearsOfService,
                date: today.toISOString()
              })
            });
          }

          result.processed++;
        } catch (error) {
          result.errors.push(`Error processing anniversary for employee ${employee.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error processing anniversary triggers: ${error}`);
    }

    return result;
  }

  /**
   * Process all automation triggers (birthdays and anniversaries)
   */
  async processAllTriggers(): Promise<{
    birthdays: AutomationResult;
    anniversaries: AutomationResult;
  }> {
    console.log('Processing automation triggers...');
    
    const [birthdays, anniversaries] = await Promise.all([
      this.processBirthdayTriggers(),
      this.processAnniversaryTriggers()
    ]);

    console.log(`Automation results:
      Birthdays: ${birthdays.processed} processed, ${birthdays.errors.length} errors
      Anniversaries: ${anniversaries.processed} processed, ${anniversaries.errors.length} errors`);

    return { birthdays, anniversaries };
  }
}

export const automationService = new AutomationService();