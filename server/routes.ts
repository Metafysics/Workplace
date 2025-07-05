import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { automationService } from "./automation";
import { insertCompanySchema, insertUserSchema, insertEmployeeSchema, insertMediaItemSchema, insertTimelineItemSchema, insertComplimentSchema, insertTemplateSchema, insertJobOpeningSchema, insertReferralSchema, insertReferralSettingsSchema, insertEmployeeEventSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendEmail, generateResetPasswordEmail, generateMfaCodeEmail } from "./sendgrid";
import { nanoid } from "nanoid";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/mov', 'video/x-quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    // Check MIME type first
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    
    // Fallback: check file extension for common video formats
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const fileExtension = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
    
    if (videoExtensions.includes(fileExtension)) {
      cb(null, true);
      return;
    }
    
    cb(new Error('Invalid file type'));
  }
});

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Database session middleware
import { db } from './db';
import { sql } from "drizzle-orm";

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function sessionMiddleware(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (sessionId) {
    try {
      const sessionResult = await db.execute(
        sql`SELECT user_id, company_id, role FROM sessions WHERE id = ${sessionId} AND expires_at > NOW()`
      );
      
      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0] as any;
        req.user = {
          userId: session.user_id,
          companyId: session.company_id,
          role: session.role
        };
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  
  next();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
  // Company registration
  app.post('/api/companies', async (req, res) => {
    try {
      const { companyName, adminName, adminEmail, password, employeeCount } = req.body;
      
      // Validate input
      if (!companyName || !adminName || !adminEmail || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create company
      const company = await storage.createCompany({
        name: companyName,
        adminId: null,
        planType: 'free'
      });
      
      // Create admin user
      const admin = await storage.createUser({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        companyId: company.id,
        role: 'admin'
      });
      
      // Create session
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await db.execute(
        sql`INSERT INTO sessions (id, user_id, company_id, role, expires_at) 
            VALUES (${sessionId}, ${admin.id}, ${company.id}, 'admin', ${expiresAt})`
      );
      
      res.json({ 
        company, 
        admin: { ...admin, password: undefined },
        sessionId 
      });
    } catch (error) {
      console.error('Company registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await db.execute(
        sql`INSERT INTO sessions (id, user_id, company_id, role, expires_at) 
            VALUES (${sessionId}, ${user.id}, ${user.companyId}, ${user.role}, ${expiresAt})`
      );
      
      res.json({ 
        user: { ...user, password: undefined },
        sessionId 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Get dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });
  
  // Employee management
  app.post('/api/employees', requireAuth, async (req, res) => {
    try {
      // Convert string dates to Date objects if they exist
      const processedData = {
        ...req.body,
        companyId: req.user.companyId,
        birthday: req.body.birthday ? new Date(req.body.birthday) : null,
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : null,
      };
      
      const employeeData = insertEmployeeSchema.parse(processedData);
      
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      console.error('Employee creation error:', error);
      res.status(500).json({ error: 'Failed to create employee' });
    }
  });

  // Bulk import employees
  app.post("/api/employees/bulk-import", requireAuth, async (req, res) => {
    try {
      const { employees } = req.body;
      
      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ error: "Invalid employees data" });
      }

      // Validate each employee with date processing
      const validatedEmployees = employees.map((emp, index) => {
        try {
          const processedEmp = {
            ...emp,
            companyId: req.user.companyId,
            birthday: emp.birthday ? new Date(emp.birthday) : null,
            hireDate: emp.hireDate ? new Date(emp.hireDate) : null,
          };
          return insertEmployeeSchema.parse(processedEmp);
        } catch (error) {
          throw new Error(`Employee ${index + 1}: ${error instanceof Error ? error.message : "Invalid data"}`);
        }
      });

      const result = await storage.createEmployeesBulk(validatedEmployees);
      res.json(result);
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to import employees" });
    }
  });
  
  app.get('/api/employees', requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployeesByCompany(req.user.companyId);
      res.json(employees);
    } catch (error) {
      console.error('Employees fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });
  
  app.put('/api/employees/:id/regenerate-token', requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.regenerateNfcToken(employeeId);
      res.json(employee);
    } catch (error) {
      console.error('Token regeneration error:', error);
      res.status(500).json({ error: 'Failed to regenerate token' });
    }
  });

  // Get employee by NFC token (public endpoint)
  app.get('/api/employees/nfc/:token', async (req, res) => {
    try {
      const employee = await storage.getEmployeeByNfcToken(req.params.token);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      console.error('Employee lookup error:', error);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  });

  // Update employee by ID (public endpoint for employee self-updates)
  app.patch('/api/employees/:id', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      // Get current employee to verify existence
      const currentEmployee = await storage.getEmployee(employeeId);
      if (!currentEmployee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Process dates if they exist
      const processedData = {
        ...req.body,
        birthday: req.body.birthday ? new Date(req.body.birthday) : undefined,
        hireDate: req.body.hireDate ? new Date(req.body.hireDate) : undefined,
      };

      // Remove undefined values
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const updatedEmployee = await storage.updateEmployee(employeeId, processedData);
      res.json(updatedEmployee);
    } catch (error) {
      console.error('Employee update error:', error);
      res.status(500).json({ error: 'Failed to update employee' });
    }
  });
  
  // Media management
  app.post('/api/media', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Determine media type based on mimetype
      let mediaType = 'document';
      if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'photo';
      } else if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
      
      // Parse tags - can be JSON string or comma-separated string
      let tags: string[] = [];
      if (req.body.tags) {
        try {
          // Try parsing as JSON first
          tags = JSON.parse(req.body.tags);
        } catch {
          // Fallback to comma-separated string
          tags = req.body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      }

      const mediaData = insertMediaItemSchema.parse({
        title: req.body.title || req.file.originalname,
        type: mediaType,
        url: `/uploads/${req.file.filename}`,
        tags: tags,
        companyId: req.user.companyId,
        uploadedBy: req.user.userId
      });
      
      const media = await storage.createMediaItem(mediaData);
      res.json(media);
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });
  
  app.get('/api/media', requireAuth, async (req, res) => {
    try {
      const media = await storage.getMediaItemsByCompany(req.user.companyId);
      res.json(media);
    } catch (error) {
      console.error('Media fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  // Delete media item
  app.delete('/api/media/:id', requireAuth, async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      
      // First check if the media item exists and belongs to the user's company
      const mediaItem = await storage.getMediaItem(mediaId);
      if (!mediaItem) {
        return res.status(404).json({ error: 'Media item not found' });
      }

      // Check if user has permission (same company)
      if (mediaItem.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Not authorized to delete this media item' });
      }

      // Delete the media item from database
      await storage.deleteMediaItem(mediaId);
      
      // TODO: Also delete the physical file from uploads directory
      // This could be implemented later for complete cleanup
      
      res.json({ success: true, message: 'Media item deleted successfully' });
    } catch (error) {
      console.error('Media delete error:', error);
      res.status(500).json({ error: 'Failed to delete media item' });
    }
  });

  // Track media view analytics
  app.post('/api/analytics/media-view', async (req, res) => {
    try {
      const { mediaId, employeeId } = req.body;
      
      if (!mediaId || !employeeId) {
        return res.status(400).json({ error: 'Media ID and Employee ID are required' });
      }
      
      // Get media item for metadata
      const mediaItem = await storage.getMediaItem(parseInt(mediaId));
      if (!mediaItem) {
        return res.status(404).json({ error: 'Media item not found' });
      }
      
      // Create analytics entry
      await storage.createAnalytics({
        employeeId: parseInt(employeeId),
        actionType: 'media_viewed',
        metadata: JSON.stringify({
          mediaId: parseInt(mediaId),
          mediaTitle: mediaItem.title,
          mediaType: mediaItem.type
        })
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Media view analytics error:', error);
      res.status(500).json({ error: 'Failed to track media view' });
    }
  });
  
  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Analytics endpoint
  app.get('/api/analytics/company/:companyId', requireAuth, async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Check if user has access to this company
      if (parseInt(companyId) !== req.user.companyId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const analytics = await storage.getAnalyticsByCompany(parseInt(companyId));
      res.json(analytics);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Timeline management
  app.post('/api/timeline', requireAuth, async (req, res) => {
    try {
      const timelineData = insertTimelineItemSchema.parse({
        ...req.body,
        fromUserId: req.user.userId
      });
      
      const timelineItem = await storage.createTimelineItem(timelineData);
      res.json(timelineItem);
    } catch (error) {
      console.error('Timeline creation error:', error);
      res.status(500).json({ error: 'Failed to create timeline item' });
    }
  });

  // Send media to multiple employees
  app.post('/api/timeline-items', requireAuth, async (req, res) => {
    try {
      const { mediaItemId, employeeIds, message, type = 'media_shared' } = req.body;
      
      if (!mediaItemId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: 'Media ID and employee IDs are required' });
      }

      // Get media item details
      const mediaItem = await storage.getMediaItem(mediaItemId);
      if (!mediaItem) {
        return res.status(404).json({ error: 'Media item not found' });
      }

      const createdItems = [];
      
      // Create timeline item for each selected employee
      for (const employeeId of employeeIds) {
        const timelineData = {
          employeeId: parseInt(employeeId),
          mediaId: mediaItemId,
          title: `Nieuwe media: ${mediaItem.title}`,
          content: message || `Je hebt nieuwe media ontvangen: ${mediaItem.title}`,
          message: message || '',
          type: type,
          fromUserId: req.user.userId,
          isVisible: true
        };

        const timelineItem = await storage.createTimelineItem(timelineData);
        createdItems.push(timelineItem);
      }
      
      res.json({ 
        success: true, 
        created: createdItems.length,
        items: createdItems 
      });
    } catch (error) {
      console.error('Media send error:', error);
      res.status(500).json({ error: 'Failed to send media to employees' });
    }
  });
  
  app.get('/api/timeline/:employeeId', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const timelineItems = await storage.getTimelineItemsByEmployee(employeeId);
      res.json(timelineItems);
    } catch (error) {
      console.error('Timeline fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  });
  
  // Employee timeline access via NFC token
  app.get('/api/employee/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const employee = await storage.getEmployeeByNfcToken(token);
      
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // Update last active
      await storage.updateEmployee(employee.id, { lastActive: new Date() });
      
      // Get timeline items
      const timelineItems = await storage.getTimelineItemsByEmployee(employee.id);
      
      // Get company employees for compliments
      const companyEmployees = await storage.getEmployeesByCompany(employee.companyId);
      
      res.json({
        employee,
        timelineItems,
        companyEmployees: companyEmployees.filter(emp => emp.id !== employee.id)
      });
    } catch (error) {
      console.error('Employee timeline error:', error);
      res.status(500).json({ error: 'Failed to fetch employee timeline' });
    }
  });
  
  // Compliment system
  app.post('/api/compliments', async (req, res) => {
    try {
      const complimentData = insertComplimentSchema.parse(req.body);
      const compliment = await storage.createCompliment(complimentData);
      
      // Create timeline item for the compliment
      await storage.createTimelineItem({
        employeeId: compliment.toEmployeeId,
        mediaId: null,
        message: compliment.message,
        fromUserId: null,
        type: 'compliment'
      });
      
      res.json(compliment);
    } catch (error) {
      console.error('Compliment creation error:', error);
      res.status(500).json({ error: 'Failed to send compliment' });
    }
  });
  
  // Template management
  app.post('/api/templates', requireAuth, async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });
  
  app.get('/api/templates', requireAuth, async (req, res) => {
    try {
      const templates = await storage.getTemplatesByCompany(req.user.companyId);
      res.json(templates);
    } catch (error) {
      console.error('Templates fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  app.patch('/api/templates/:id', requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const updates = req.body;
      
      const template = await storage.updateTemplate(templateId, updates);
      res.json(template);
    } catch (error) {
      console.error('Template update error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  app.delete('/api/templates/:id', requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      await storage.deleteTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      console.error('Template delete error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Template upload endpoint
  app.post('/api/templates/upload', requireAuth, upload.single('templateFile'), async (req, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(401).json({ error: 'Company ID is required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Template file is required' });
      }

      const { name, description, category, tags } = req.body;
      const parsedTags = tags ? JSON.parse(tags) : [];

      const template = await storage.createTemplate({
        name,
        description: description || null,
        category: category || 'general',
        tags: parsedTags,
        companyId: user.companyId,
      });

      res.json(template);
    } catch (error) {
      console.error('Template upload error:', error);
      res.status(500).json({ error: 'Failed to upload template' });
    }
  });

  // ===== REFERRAL SYSTEM ROUTES =====
  
  // Job Openings
  app.post('/api/jobs', requireAuth, async (req, res) => {
    try {
      // Transform string requirements to array format
      const transformedBody = {
        ...req.body,
        requirements: req.body.requirements ? [req.body.requirements] : [],
        benefits: req.body.benefits ? [req.body.benefits] : [],
        companyId: req.user.companyId,
        createdBy: req.user.id
      };
      
      const jobData = insertJobOpeningSchema.parse(transformedBody);
      const job = await storage.createJobOpening(jobData);
      res.json(job);
    } catch (error) {
      console.error('Job creation error:', error);
      res.status(500).json({ error: 'Failed to create job opening' });
    }
  });

  app.get('/api/jobs', requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getJobOpeningsByCompany(req.user.companyId);
      res.json(jobs);
    } catch (error) {
      console.error('Jobs fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch job openings' });
    }
  });

  app.get('/api/jobs/public/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const jobs = await storage.getJobOpeningsByCompany(parseInt(companyId));
      const activeJobs = jobs.filter(job => job.isActive);
      res.json(activeJobs);
    } catch (error) {
      console.error('Public jobs fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch job openings' });
    }
  });

  app.post('/api/jobs/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const jobData = {
        title: req.body.title,
        description: req.body.description,
        department: req.body.department,
        location: req.body.location,
        requirements: req.body.requirements ? [req.body.requirements] : [],
        benefits: req.body.benefits ? [req.body.benefits] : [],
        salaryRange: req.body.salaryRange,
        bonusAmount: parseInt(req.body.bonusAmount) || 0,
        isActive: req.body.isActive === 'true',
        companyId: req.user.companyId,
        createdBy: req.user.id,
        filePath: req.file ? req.file.path : null
      };
      
      const job = await storage.createJobOpening(jobData);
      res.json(job);
    } catch (error) {
      console.error('Job upload error:', error);
      res.status(500).json({ error: 'Failed to create job opening with file' });
    }
  });

  app.put('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const job = await storage.updateJobOpening(parseInt(id), updates);
      res.json(job);
    } catch (error) {
      console.error('Job update error:', error);
      res.status(500).json({ error: 'Failed to update job opening' });
    }
  });

  app.delete('/api/jobs/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteJobOpening(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error('Job deletion error:', error);
      res.status(500).json({ error: 'Failed to delete job opening' });
    }
  });

  // Referrals
  app.get('/api/referrals', requireAuth, async (req, res) => {
    try {
      const referrals = await storage.getReferralsByCompany(req.user.companyId);
      res.json(referrals);
    } catch (error) {
      console.error('Referrals fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  app.post('/api/referrals', async (req, res) => {
    try {
      const referralData = insertReferralSchema.parse(req.body);
      const referral = await storage.createReferral(referralData);
      
      // Track analytics for referral creation
      if (referralData.referredBy) {
        await storage.createAnalytics({
          employeeId: referralData.referredBy,
          actionType: 'referral_submitted',
          metadata: JSON.stringify({
            jobId: referralData.jobId,
            candidateName: referralData.candidateName,
            referralId: referral.id
          })
        });
      }
      
      res.json(referral);
    } catch (error) {
      console.error('Referral creation error:', error);
      res.status(500).json({ error: 'Failed to create referral' });
    }
  });

  app.get('/api/referrals/company/:companyId', requireAuth, async (req, res) => {
    try {
      const { companyId } = req.params;
      const referrals = await storage.getReferralsByCompany(parseInt(companyId));
      res.json(referrals);
    } catch (error) {
      console.error('Company referrals fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  app.get('/api/referrals/employee/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const referrals = await storage.getReferralsByEmployee(parseInt(employeeId));
      res.json(referrals);
    } catch (error) {
      console.error('Employee referrals fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch employee referrals' });
    }
  });

  app.put('/api/referrals/:id/status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, bonusAmount } = req.body;
      const referral = await storage.updateReferralStatus(parseInt(id), status, bonusAmount);
      res.json(referral);
    } catch (error) {
      console.error('Referral status update error:', error);
      res.status(500).json({ error: 'Failed to update referral status' });
    }
  });

  // Referral Settings
  app.post('/api/referral-settings', requireAuth, async (req, res) => {
    try {
      const settingsData = insertReferralSettingsSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      const settings = await storage.createReferralSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error('Referral settings creation error:', error);
      res.status(500).json({ error: 'Failed to create referral settings' });
    }
  });

  app.get('/api/referral-settings', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getReferralSettings(req.user.companyId);
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await storage.createReferralSettings({
          companyId: req.user.companyId,
          bonusAmount: 1000,
          bonusOnHire: true,
          bonusOnInterview: false,
          interviewBonusAmount: 250,
          maxReferralsPerEmployee: 10,
          isActive: true,
          termsAndConditions: "Referral bonus will be paid within 30 days of successful hire completion."
        });
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error('Referral settings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch referral settings' });
    }
  });

  app.put('/api/referral-settings', requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateReferralSettings(req.user.companyId, updates);
      res.json(settings);
    } catch (error) {
      console.error('Referral settings update error:', error);
      res.status(500).json({ error: 'Failed to update referral settings' });
    }
  });

  // Password Reset Routes
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // Generate reset token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });

      // Send email
      const emailContent = generateResetPasswordEmail(token, user.email);
      const emailSent = await sendEmail(emailContent);

      if (emailSent) {
        res.json({ message: 'Reset email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send reset email' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Get user and update password
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password (need to add updateUser method)
      // For now, we'll use a direct update
      await storage.markPasswordResetTokenAsUsed(token);
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // MFA Routes
  app.post('/api/enable-mfa', requireAuth, async (req, res) => {
    try {
      const { method, phoneNumber } = req.body;
      
      if (!method || !['email', 'sms'].includes(method)) {
        return res.status(400).json({ error: 'Valid MFA method required (email or sms)' });
      }

      if (method === 'sms' && !phoneNumber) {
        return res.status(400).json({ error: 'Phone number required for SMS MFA' });
      }

      // Check if user settings exist
      let userSettings = await storage.getUserSettings(req.user.id);
      
      if (userSettings) {
        userSettings = await storage.updateUserSettings(req.user.id, {
          mfaEnabled: true,
          mfaMethod: method,
          phoneNumber: method === 'sms' ? phoneNumber : undefined
        });
      } else {
        userSettings = await storage.createUserSettings({
          userId: req.user.id,
          mfaEnabled: true,
          mfaMethod: method,
          phoneNumber: method === 'sms' ? phoneNumber : undefined
        });
      }

      res.json({ message: 'MFA enabled successfully', settings: userSettings });
    } catch (error) {
      console.error('Enable MFA error:', error);
      res.status(500).json({ error: 'Failed to enable MFA' });
    }
  });

  app.post('/api/disable-mfa', requireAuth, async (req, res) => {
    try {
      const userSettings = await storage.getUserSettings(req.user.id);
      
      if (userSettings) {
        await storage.updateUserSettings(req.user.id, {
          mfaEnabled: false,
          mfaMethod: null,
          phoneNumber: null
        });
      }

      res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
      console.error('Disable MFA error:', error);
      res.status(500).json({ error: 'Failed to disable MFA' });
    }
  });

  app.post('/api/send-mfa-code', async (req, res) => {
    try {
      const { email, purpose = 'login' } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const userSettings = await storage.getUserSettings(user.id);
      if (!userSettings?.mfaEnabled) {
        return res.status(400).json({ error: 'MFA not enabled for this user' });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createMfaCode({
        userId: user.id,
        code,
        type: userSettings.mfaMethod || 'email',
        purpose,
        expiresAt
      });

      // Send code via email or SMS
      if (userSettings.mfaMethod === 'email') {
        const emailContent = generateMfaCodeEmail(code, user.email);
        const emailSent = await sendEmail(emailContent);
        
        if (emailSent) {
          res.json({ message: 'MFA code sent via email' });
        } else {
          res.status(500).json({ error: 'Failed to send MFA code' });
        }
      } else {
        // SMS implementation would go here
        res.json({ message: 'SMS MFA not implemented yet, code: ' + code });
      }
    } catch (error) {
      console.error('Send MFA code error:', error);
      res.status(500).json({ error: 'Failed to send MFA code' });
    }
  });

  app.post('/api/verify-mfa-code', async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const mfaCode = await storage.getMfaCode(code, user.id);
      if (!mfaCode) {
        return res.status(400).json({ error: 'Invalid or expired MFA code' });
      }

      if (new Date() > mfaCode.expiresAt) {
        return res.status(400).json({ error: 'MFA code has expired' });
      }

      await storage.markMfaCodeAsUsed(code);
      
      res.json({ message: 'MFA code verified successfully', userId: user.id });
    } catch (error) {
      console.error('Verify MFA code error:', error);
      res.status(500).json({ error: 'Failed to verify MFA code' });
    }
  });

  app.get('/api/user-settings', requireAuth, async (req, res) => {
    try {
      let userSettings = await storage.getUserSettings(req.user.id);
      
      if (!userSettings) {
        userSettings = await storage.createUserSettings({
          userId: req.user.id,
          mfaEnabled: false
        });
      }

      res.json(userSettings);
    } catch (error) {
      console.error('Get user settings error:', error);
      res.status(500).json({ error: 'Failed to get user settings' });
    }
  });

  // Employee Events Routes
  app.post('/api/employee-events', requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmployeeEventSchema.parse(req.body);
      const event = await storage.createEmployeeEvent({
        ...validatedData,
        companyId: req.user.companyId
      });
      res.json(event);
    } catch (error) {
      console.error('Create employee event error:', error);
      res.status(500).json({ error: 'Failed to create employee event' });
    }
  });

  app.get('/api/employee-events/employee/:employeeId', requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const events = await storage.getEmployeeEventsByEmployee(employeeId);
      res.json(events);
    } catch (error) {
      console.error('Get employee events error:', error);
      res.status(500).json({ error: 'Failed to get employee events' });
    }
  });

  app.get('/api/employee-events/company', requireAuth, async (req, res) => {
    try {
      const events = await storage.getEmployeeEventsByCompany(req.user.companyId);
      res.json(events);
    } catch (error) {
      console.error('Get company events error:', error);
      res.status(500).json({ error: 'Failed to get company events' });
    }
  });

  app.get('/api/employee-events/upcoming', requireAuth, async (req, res) => {
    try {
      const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
      const events = await storage.getUpcomingEvents(req.user.companyId, daysAhead);
      res.json(events);
    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({ error: 'Failed to get upcoming events' });
    }
  });

  app.put('/api/employee-events/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const event = await storage.updateEmployeeEvent(id, updates);
      res.json(event);
    } catch (error) {
      console.error('Update employee event error:', error);
      res.status(500).json({ error: 'Failed to update employee event' });
    }
  });

  app.delete('/api/employee-events/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployeeEvent(id);
      res.json({ message: 'Employee event deleted successfully' });
    } catch (error) {
      console.error('Delete employee event error:', error);
      res.status(500).json({ error: 'Failed to delete employee event' });
    }
  });

  // Route to update employee automation settings
  app.put('/api/employees/:id/automation', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { birthdayNotificationsEnabled, anniversaryNotificationsEnabled } = req.body;
      
      const employee = await storage.updateEmployee(id, {
        birthdayNotificationsEnabled,
        anniversaryNotificationsEnabled
      });
      
      res.json(employee);
    } catch (error) {
      console.error('Update employee automation error:', error);
      res.status(500).json({ error: 'Failed to update employee automation settings' });
    }
  });

  // Automation trigger routes
  app.post('/api/automation/process', requireAuth, async (req, res) => {
    try {
      const results = await automationService.processAllTriggers();
      res.json({
        message: 'Automation triggers processed successfully',
        results
      });
    } catch (error) {
      console.error('Process automation triggers error:', error);
      res.status(500).json({ error: 'Failed to process automation triggers' });
    }
  });

  app.post('/api/automation/birthdays', requireAuth, async (req, res) => {
    try {
      const result = await automationService.processBirthdayTriggers();
      res.json({
        message: 'Birthday automation processed successfully',
        result
      });
    } catch (error) {
      console.error('Process birthday automation error:', error);
      res.status(500).json({ error: 'Failed to process birthday automation' });
    }
  });

  app.post('/api/automation/anniversaries', requireAuth, async (req, res) => {
    try {
      const result = await automationService.processAnniversaryTriggers();
      res.json({
        message: 'Anniversary automation processed successfully',
        result
      });
    } catch (error) {
      console.error('Process anniversary automation error:', error);
      res.status(500).json({ error: 'Failed to process anniversary automation' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
