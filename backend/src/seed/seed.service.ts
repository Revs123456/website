import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Settings seed runs in all environments — skipDuplicates ensures it's idempotent
    await this.seedSettings();
    // Badges are normative app state (criteria are interpreted by code) — seed in prod too.
    // Idempotent: uses upsert on the unique `code` column.
    await this.seedBadges();
    // Plans are normative app state (gating logic references them by code). Seed in prod.
    await this.seedPlans();
    if (process.env.NODE_ENV === 'production') return;
    await this.seedAdmin();
    await this.seedJobs();
    await this.seedCourses();
    await this.seedBlogs();
    await this.seedServices();
    await this.seedTestimonials();
    await this.seedInterviewQuestions();
    await this.seedSalaryInsights();
    await this.seedDailyTips();
    await this.seedRoadmaps();
  }

  private async seedPlans() {
    // Phase 5 — Pro pricing tiers. razorpay_plan_id is intentionally left null;
    // SubscriptionsService.ensureRazorpayPlanId() creates it lazily on first
    // checkout so test/dev/prod environments self-bootstrap.
    const catalog = [
      {
        code:        'pro_monthly',
        name:        'Pro Monthly',
        description: 'Unlimited AI features, billed monthly',
        price_inr:   49900,    // ₹499 in paise
        period:      'monthly',
        interval:    1,
        features: [
          'Unlimited AI Resume Optimizations',
          'Unlimited Mock Interviews',
          'Unlimited Answer Evaluations',
          'Unlimited RevBot Career Coach',
          'Monthly streak shield (auto-saves one missed day)',
          'Priority email support',
          'PRO badge on your public profile',
        ],
        sort_order: 1,
      },
      {
        code:        'pro_annual',
        name:        'Pro Annual',
        description: 'Same as Monthly. Save ₹989/year.',
        price_inr:   499900,   // ₹4999 in paise (saves ~₹989 vs 12×monthly)
        period:      'yearly',
        interval:    1,
        features: [
          'Everything in Pro Monthly',
          'Save ₹989 vs paying monthly',
          'Locked-in price for 12 months',
          'Best for serious career growth',
        ],
        sort_order: 0,    // shown first as the recommended plan
      },
    ] as const;

    for (const plan of catalog) {
      await this.prisma.plan.upsert({
        where: { code: plan.code },
        update: {
          name:        plan.name,
          description: plan.description,
          price_inr:   plan.price_inr,
          period:      plan.period,
          interval:    plan.interval,
          features:    plan.features as any,
          sort_order:  plan.sort_order,
          // Deliberately DO NOT overwrite razorpay_plan_id here —
          // re-seeding shouldn't break in-flight subscriptions.
        },
        create: {
          code:        plan.code,
          name:        plan.name,
          description: plan.description,
          price_inr:   plan.price_inr,
          period:      plan.period,
          interval:    plan.interval,
          features:    plan.features as any,
          sort_order:  plan.sort_order,
        },
      });
    }
  }

  private async seedBadges() {
    // Catalog kept inline (small, stable, code-coupled). Adding new badges is
    // a code change — keeps badge criteria in lock-step with evaluator support.
    const catalog = [
      // Profile / onboarding
      { code: 'first_steps',        name: 'First Steps',         description: 'Created your account.',                        icon: '👋', tier: 'bronze',  criteria: { type: 'xp', threshold: 25 } },
      { code: 'profile_pro',        name: 'Profile Pro',         description: 'Filled out your full profile.',                icon: '📋', tier: 'silver',  criteria: { type: 'profile_complete' } },
      { code: 'identity_claimed',   name: 'Identity Claimed',    description: 'Picked your unique username.',                 icon: '🪪', tier: 'bronze',  criteria: { type: 'username_set' } },

      // Daily challenges
      { code: 'first_challenge',    name: 'First Challenge',     description: 'Submitted your first daily challenge.',        icon: '🎯', tier: 'bronze',  criteria: { type: 'challenges', threshold: 1 } },
      { code: 'committed',          name: 'Committed',           description: '10 daily challenges submitted.',               icon: '✊', tier: 'silver',  criteria: { type: 'challenges', threshold: 10 } },
      { code: 'unstoppable',        name: 'Unstoppable',         description: '50 daily challenges submitted.',               icon: '🚀', tier: 'gold',    criteria: { type: 'challenges', threshold: 50 } },

      // Streaks
      { code: 'streak_3',           name: 'Three in a Row',      description: '3-day streak. Habit forming.',                 icon: '🔥', tier: 'bronze',  criteria: { type: 'streak', threshold: 3 } },
      { code: 'streak_7',           name: 'Week Warrior',        description: '7-day streak. You\'re on a roll.',             icon: '🔥', tier: 'silver',  criteria: { type: 'streak', threshold: 7 } },
      { code: 'streak_30',          name: 'Streak Legend',       description: '30-day streak. Real discipline.',              icon: '🔥', tier: 'gold',    criteria: { type: 'streak', threshold: 30 } },
      { code: 'streak_100',         name: 'Untouchable',         description: '100-day streak. Pure dedication.',             icon: '💎', tier: 'platinum', criteria: { type: 'streak', threshold: 100 } },

      // Level milestones
      { code: 'level_intern',       name: 'Intern',              description: 'Reached Level 2.',                              icon: '🌱', tier: 'bronze',  criteria: { type: 'level', threshold: 2 } },
      { code: 'level_mid',          name: 'Mid-Level Dev',       description: 'Reached Level 4.',                              icon: '💼', tier: 'silver',  criteria: { type: 'level', threshold: 4 } },
      { code: 'level_senior',       name: 'Senior Dev',          description: 'Reached Level 5.',                              icon: '🎖️', tier: 'gold',    criteria: { type: 'level', threshold: 5 } },
      { code: 'level_architect',    name: 'Tech Architect',      description: 'Reached the final tier.',                       icon: '🏛️', tier: 'platinum', criteria: { type: 'level', threshold: 8 } },
    ] as const;

    for (const badge of catalog) {
      await this.prisma.badge.upsert({
        where: { code: badge.code },
        update: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          tier: badge.tier,
          criteria: badge.criteria as any,
          published: true,
        },
        create: {
          code: badge.code,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          tier: badge.tier,
          criteria: badge.criteria as any,
        },
      });
    }
  }

  private async seedAdmin() {
    const count = await this.prisma.admin.count();
    if (count > 0) return;
    const passwordHash = await bcrypt.hash('admin@123', 12);
    await this.prisma.admin.create({ data: { email: 'admin@techcareerhub.in', passwordHash } });
  }

  private async seedJobs() {
    const count = await this.prisma.job.count();
    if (count > 0) return;
    const jobs = [
      { title: 'Senior React Developer', company: 'TechCorp', location: 'Remote', experience: '4–6 yrs', type: 'Full-time', category: 'Frontend', salary: '₹18–25 LPA', description: "We're looking for a Senior React Developer to join our fully-remote engineering team. You'll own the frontend architecture of our core product used by 100K+ users daily.\n\nYou'll work closely with designers and backend engineers to ship features that matter.", requirements: JSON.stringify(['Strong TypeScript and React skills', 'Experience with Next.js App Router', 'State management (Zustand or Redux Toolkit)', 'REST and GraphQL API integration', 'CI/CD and testing (Jest, Playwright)']), benefits: JSON.stringify(['Fully remote', 'Health & dental insurance', 'Stock options', '30 days PTO', '₹50K/yr learning budget']), tech_stack: JSON.stringify(['React 18', 'Next.js 14', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest']), apply_link: '#' },
      { title: 'Backend Engineer (Node.js)', company: 'InnovateHub', location: 'Bengaluru', experience: '2–4 yrs', type: 'Full-time', category: 'Backend', salary: '₹12–18 LPA', description: 'Join our backend team to build scalable microservices. You will design APIs, optimize database queries, and ensure system reliability at scale.', requirements: JSON.stringify(['Node.js and Express/NestJS expertise', 'PostgreSQL and MongoDB experience', 'Docker and Kubernetes basics', 'REST API design best practices']), benefits: JSON.stringify(['Flexible hours', 'Remote-friendly', 'Gym allowance', 'Annual bonus']), tech_stack: JSON.stringify(['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'TypeScript']), apply_link: '#' },
      { title: 'DevOps Engineer', company: 'CloudWorks', location: 'Remote', experience: '3–5 yrs', type: 'Contract', category: 'DevOps', salary: '₹20–30 LPA', description: 'We need an experienced DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Terraform, and Kubernetes.', requirements: JSON.stringify(['AWS or GCP expertise', 'Terraform and Ansible', 'Kubernetes cluster management', 'CI/CD with GitHub Actions', 'Linux systems administration']), benefits: JSON.stringify(['Remote work', 'Competitive hourly rate', 'Flexible schedule', 'Latest equipment']), tech_stack: JSON.stringify(['AWS', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Docker']), apply_link: '#' },
      { title: 'Frontend Intern', company: 'StartupUI', location: 'Remote', experience: 'Fresher', type: 'Internship', category: 'Frontend', salary: '₹8–12K/mo', description: 'Great opportunity for freshers to gain real-world experience building modern web interfaces with React and Tailwind CSS.', requirements: JSON.stringify(['Basic HTML, CSS, JavaScript', 'Familiarity with React', 'Good communication skills', 'Eagerness to learn']), benefits: JSON.stringify(['Remote internship', 'Certificate on completion', 'Pre-placement offer opportunity', 'Mentorship from seniors']), tech_stack: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'React']), apply_link: '#' },
      { title: 'Full-Stack Engineer', company: 'ScaleHQ', location: 'Hyderabad', experience: '3–6 yrs', type: 'Full-time', category: 'Full-Stack', salary: '₹15–22 LPA', description: 'Build end-to-end features on our SaaS platform. You will work across the React frontend and Node.js backend, contributing to a product used by thousands.', requirements: JSON.stringify(['React and Node.js expertise', 'Database design (PostgreSQL/MongoDB)', 'REST API development', 'Git and agile workflows', 'Testing and code review experience']), benefits: JSON.stringify(['Hybrid work model', 'Health insurance', 'ESOP', 'Annual tech allowance']), tech_stack: JSON.stringify(['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS']), apply_link: '#' },
      { title: 'ML Engineer', company: 'DataMinds', location: 'Remote', experience: '2–4 yrs', type: 'Full-time', category: 'AI/ML', salary: '₹20–35 LPA', description: 'Work on cutting-edge machine learning models for NLP and computer vision. Collaborate with data scientists to take models from research to production.', requirements: JSON.stringify(['Python expertise', 'TensorFlow or PyTorch', 'MLOps experience', 'Strong statistics background', 'Cloud ML platforms (AWS/GCP)']), benefits: JSON.stringify(['Fully remote', 'Research paper budget', 'Conference allowance', 'Competitive salary']), tech_stack: JSON.stringify(['Python', 'TensorFlow', 'PyTorch', 'AWS SageMaker', 'Docker']), apply_link: '#' },
    ];
    await this.prisma.job.createMany({ data: jobs as any[] });
  }

  private async seedCourses() {
    // Remove duplicate courses (same title, keep latest)
    const allCourses = await this.prisma.course.findMany({ orderBy: { created_at: 'asc' } });
    const seen = new Map<string, string>();
    for (const course of allCourses) {
      if (seen.has(course.title)) {
        await this.prisma.course.delete({ where: { id: seen.get(course.title)! } });
      }
      seen.set(course.title, course.id);
    }

    const count = await this.prisma.course.count();
    if (count > 0) return;
    const courses = [
      { title: 'Complete React & Next.js Bootcamp', platform: 'Udemy', category: 'Frontend', duration: '40h', level: 'Beginner', instructor: 'Maximilian Schwarzmüller', rating: 4.8, students: '120K', price: '₹499', description: 'Master React 18, Next.js 14, TypeScript, Redux Toolkit, and Tailwind CSS. The most comprehensive React course available — from fundamentals to production-ready full-stack apps.', modules: JSON.stringify(['React Fundamentals & Hooks', 'Next.js App Router', 'Styling with Tailwind CSS', 'State Management', 'Database Integration (Prisma)', 'Authentication & Authorization', 'Performance Optimization', 'Deployment & CI/CD']), course_link: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/' },
      { title: 'Kubernetes for Developers', platform: 'Coursera', category: 'DevOps', duration: '15h', level: 'Intermediate', instructor: 'Google Cloud', rating: 4.7, students: '45K', price: '₹799', description: 'Learn Kubernetes from the ground up. This course covers pods, deployments, services, Helm charts, and running production-grade workloads on Kubernetes.', modules: JSON.stringify(['Container Basics', 'Pods & Deployments', 'Services & Networking', 'ConfigMaps & Secrets', 'Helm Charts', 'Kubernetes on GKE', 'Monitoring & Logging']), course_link: 'https://www.coursera.org/learn/google-kubernetes-engine' },
      { title: 'Machine Learning A-Z', platform: 'Udemy', category: 'AI/ML', duration: '45h', level: 'Beginner', instructor: 'Kirill Eremenko', rating: 4.6, students: '200K', price: '₹499', description: 'The most complete Machine Learning course on Udemy. Covers supervised, unsupervised learning, NLP, deep learning — all in Python and R.', modules: JSON.stringify(['Python & R basics', 'Data Preprocessing', 'Regression', 'Classification', 'Clustering', 'NLP', 'Deep Learning with TensorFlow', 'Model Deployment']), course_link: 'https://www.udemy.com/course/machinelearning/' },
      { title: "NestJS: The Complete Developer's Guide", platform: 'Udemy', category: 'Backend', duration: '25h', level: 'Intermediate', instructor: 'Stephen Grider', rating: 4.8, students: '55K', price: '₹499', description: 'Build full-stack applications with NestJS and TypeORM. Covers Guards, Interceptors, Microservices, GraphQL, and enterprise-grade REST APIs.', modules: JSON.stringify(['NestJS Architecture', 'Modules & Providers', 'Guards & Interceptors', 'TypeORM Integration', 'Authentication with JWT', 'Testing NestJS Apps', 'Deployment']), course_link: 'https://www.udemy.com/course/nestjs-the-complete-developers-guide/' },
      { title: 'TypeScript: The Complete Guide', platform: 'Udemy', category: 'Frontend', duration: '28h', level: 'Intermediate', instructor: 'Stephen Grider', rating: 4.8, students: '85K', price: '₹499', description: 'A comprehensive guide to TypeScript including types, interfaces, generics, decorators, and integrating TypeScript with React and Node.js.', modules: JSON.stringify(['Type Annotations', 'Interfaces & Classes', 'Generics', 'Decorators', 'TypeScript with React', 'TypeScript with Node.js', 'Advanced Patterns']), course_link: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/' },
      { title: 'AWS Solutions Architect', platform: 'Coursera', category: 'DevOps', duration: '35h', level: 'Advanced', instructor: 'Amazon Web Services', rating: 4.7, students: '60K', price: '₹999', description: 'Prepare for the AWS Solutions Architect Associate exam. Covers EC2, S3, RDS, Lambda, VPC, IAM, and cloud architecture best practices.', modules: JSON.stringify(['AWS Fundamentals', 'EC2 & Auto Scaling', 'S3 & CloudFront', 'RDS & DynamoDB', 'Lambda & Serverless', 'VPC & Networking', 'IAM & Security', 'Exam Prep']), course_link: 'https://www.coursera.org/learn/aws-certified-solutions-architect-associate' },
      { title: 'Full Stack Web Development Bootcamp', platform: 'YouTube', category: 'Full-Stack', duration: '12h', level: 'Beginner', instructor: 'Traversy Media', rating: 4.7, students: '500K', price: '', description: 'A complete free bootcamp covering HTML, CSS, JavaScript, Node.js, Express, MongoDB and React from scratch. Perfect for beginners.', modules: JSON.stringify(['HTML & CSS Basics', 'JavaScript Essentials', 'DOM Manipulation', 'Node.js & Express', 'MongoDB & Mongoose', 'React Fundamentals', 'Building & Deploying']), course_link: 'https://www.youtube.com/watch?v=f2EqECiTBL8' },
      { title: 'Git & GitHub for Beginners', platform: 'YouTube', category: 'DevOps', duration: '3h', level: 'Beginner', instructor: 'freeCodeCamp', rating: 4.9, students: '2M', price: '', description: 'Learn Git version control and GitHub from scratch. Covers commits, branches, pull requests, merging, and collaboration workflows.', modules: JSON.stringify(['Git Basics', 'Branching & Merging', 'Remote Repositories', 'Pull Requests', 'GitHub Workflows', 'Resolving Conflicts']), course_link: 'https://www.youtube.com/watch?v=RGOj5yH7evk' },
      { title: 'Python for Everybody', platform: 'Coursera', category: 'Backend', duration: '30h', level: 'Beginner', instructor: 'Dr. Charles Severance', rating: 4.8, students: '1.2M', price: '', description: 'Learn Python from scratch with this popular Coursera specialization. Covers data structures, web scraping, databases, and data visualization.', modules: JSON.stringify(['Python Basics', 'Data Structures', 'Using Python to Access Web Data', 'Using Databases with Python', 'Capstone Project']), course_link: 'https://www.coursera.org/specializations/python' },
      { title: 'CSS Full Course - Flexbox & Grid', platform: 'YouTube', category: 'Frontend', duration: '11h', level: 'Beginner', instructor: 'Dave Gray', rating: 4.8, students: '800K', price: '', description: 'A comprehensive free CSS course covering Flexbox, Grid, animations, responsive design, and modern CSS features.', modules: JSON.stringify(['CSS Selectors', 'Box Model', 'Flexbox Layout', 'CSS Grid', 'Responsive Design', 'Animations & Transitions', 'CSS Variables']), course_link: 'https://www.youtube.com/watch?v=OXGznpKZ_sA' },
    ];
    await this.prisma.course.createMany({ data: courses as any[] });
  }

  private async seedBlogs() {
    const count = await this.prisma.blog.count();
    if (count > 0) return;
    const blogs = [
      { title: 'How to Write an ATS-Optimized Resume in 2025', category: 'Resume Tips', author: 'Priya Sharma', read_time: '8 min read', summary: "Applicant Tracking Systems scan your resume before a human ever sees it. Here's how to beat them with the right keywords, formatting, and structure.", content: `## Why ATS Matters\n\nOver 90% of Fortune 500 companies use Applicant Tracking Systems to filter resumes before they reach a recruiter. If your resume isn't ATS-friendly, it may never be seen.\n\n## Key Strategies\n\n**1. Use relevant keywords**\nMatch your resume to the job description. Use the exact phrases and skills mentioned in the listing.\n\n**2. Clean formatting**\nAvoid tables, columns, headers/footers, and fancy fonts. Stick to a single-column layout with standard headings.\n\n**3. Use standard section headings**\nUse headings like "Work Experience", "Education", "Skills" — not creative alternatives like "My Journey" or "What I've Built".\n\n**4. Quantify achievements**\nInstead of "improved performance", write "reduced page load time by 40%".\n\n**5. Save as PDF or DOCX**\nMost ATS systems handle both, but check the job posting for preferences.\n\n## Checklist\n- [ ] Keywords from job description included\n- [ ] Single-column layout\n- [ ] Standard section headings\n- [ ] Achievements quantified\n- [ ] Saved in correct format`, cover_image: '', published: true },
      { title: 'Frontend vs Backend vs Full-Stack: Which Path is Right for You?', category: 'Career Advice', author: 'Rahul Verma', read_time: '6 min read', summary: 'Choosing your specialization is one of the most important early career decisions. This guide breaks down each path so you can make the right choice.', content: `## The Three Paths\n\n### Frontend Development\nFrontend developers build what users see and interact with. You'll work with HTML, CSS, JavaScript, and frameworks like React or Vue.\n\n**Pros:** Creative work, visual results, high demand\n**Cons:** Browser compatibility, keeping up with evolving tools\n\n**Key skills:** React/Vue, TypeScript, CSS, responsive design\n\n### Backend Development\nBackend developers build the server, APIs, and database layer. You'll work with Node.js, Python, or Java, plus databases like PostgreSQL.\n\n**Pros:** High salaries, stable foundations, logic-focused\n**Cons:** Less visual feedback, complex architecture decisions\n\n**Key skills:** Node.js/Python, SQL, REST/GraphQL APIs, Docker\n\n### Full-Stack Development\nFull-stack developers work on both frontend and backend. You need broader knowledge but have more flexibility.\n\n**Pros:** Versatile, can build complete products, high demand at startups\n**Cons:** Depth vs breadth tradeoff, more to learn\n\n## Which Should You Choose?\n\n- If you love visual design and UX → **Frontend**\n- If you love systems, data, and logic → **Backend**\n- If you want flexibility or work at startups → **Full-Stack**`, cover_image: '', published: true },
      { title: '10 GitHub Profile Tips That Will Get You Hired', category: 'Job Search', author: 'Arjun Mehta', read_time: '5 min read', summary: 'Your GitHub profile is your developer portfolio. Recruiters check it. Here are 10 actionable tips to make yours stand out.', content: "## Why Your GitHub Profile Matters\n\nFor developers, GitHub is often more important than a resume. It shows real work, not just claims.\n\n## 10 Tips\n\n**1. Write a great README profile**\nCreate a `username/username` repo with a README. Include your skills, what you're working on, and contact info.\n\n**2. Pin your best repositories**\nPin 6 repositories that showcase your best work. Include a clear description for each.\n\n**3. Add README files to all pinned repos**\nEvery pinned project should have a README with: what it does, tech stack, how to run it, screenshots.\n\n**4. Keep your contribution graph green**\nConsistent contributions signal active development. Aim to commit code daily, even if it's small.\n\n**5. Contribute to open source**\nEven small contributions to popular projects signal expertise and collaboration skills.\n\n**6. Use descriptive commit messages**\nWrite clear commit messages like \"fix: resolve login redirect issue\" not \"fix stuff\".\n\n**7. Organize your code cleanly**\nUse proper folder structure, follow naming conventions, add .gitignore files.\n\n**8. Add topics/tags to repos**\nTag repos with relevant topics so they appear in GitHub search.\n\n**9. Star relevant repos**\nYour starred repos show your interests to potential employers.\n\n**10. Connect GitHub to LinkedIn**\nAdd your GitHub URL to your LinkedIn profile and resume.", cover_image: '', published: true },
      { title: 'The Complete Guide to Cracking Tech Interviews in India', category: 'Interview Prep', author: 'Sneha Patel', read_time: '10 min read', summary: 'From DSA to system design to HR rounds — everything you need to know to crack interviews at top Indian tech companies.', content: `## The Indian Tech Interview Process\n\nMost tech companies in India follow a 3-5 round interview process:\n1. Online Assessment (DSA)\n2. Technical Round 1 (DSA + Problem Solving)\n3. Technical Round 2 (System Design or Project Discussion)\n4. HR / Culture Fit\n\n## Data Structures & Algorithms\n\nDSA is the most important part. Focus on:\n- Arrays and Strings\n- Linked Lists\n- Trees and Graphs\n- Dynamic Programming\n- Searching and Sorting\n\n**Resources:** LeetCode, GeeksForGeeks, Striver's A-Z DSA Sheet\n\n## System Design\n\nFor 3+ years experience, expect system design questions. Study:\n- Load balancers, CDNs\n- Database sharding and replication\n- Caching strategies (Redis)\n- Microservices vs monoliths\n- Message queues (Kafka, RabbitMQ)\n\n## Project Discussion\n\nBe ready to explain your projects in detail:\n- Why you made certain technology choices\n- Challenges you faced and how you solved them\n- How you would scale it\n\n## Companies to Target (2025)\n\n- **FAANG equivalent:** Google, Microsoft, Amazon, Meta\n- **Indian unicorns:** Razorpay, CRED, Zepto, Meesho\n- **Startups:** Hundreds of well-funded companies hiring aggressively`, cover_image: '', published: true },
    ];
    await this.prisma.blog.createMany({ data: blogs as any[] });
  }

  private async seedServices() {
    const count = await this.prisma.service.count();
    if (count > 0) {
      const newServices = [
        { name: '1:1 Career Call', description: 'A 30-minute one-on-one call with our career expert. Get personalised advice on your resume, job search strategy, or interview prep.', price: '₹500', included_features: JSON.stringify(['30-min video/voice call', 'Resume feedback', 'Career roadmap guidance', 'Interview tips', 'Q&A session']) },
        { name: 'Mock Interview', description: 'Simulated interview session conducted by an experienced interviewer. Get real-time feedback to boost your confidence before the actual interview.', price: '₹799', included_features: JSON.stringify(['45-min mock interview session', 'Real-time feedback', 'Strengths & weaknesses report', 'Common mistakes highlighted', 'Follow-up tips']) },
        { name: 'Recruiter-Level Interview Questions', description: 'Curated set of interview questions used by top recruiters, tailored to your target role and company. Includes model answers.', price: '₹399', included_features: JSON.stringify(['50+ role-specific questions', 'Model answers included', 'Company-specific questions', 'HR round questions', 'PDF format delivery']) },
        { name: 'ATS Resume — India Format', description: 'Professional ATS-optimised resume crafted specifically for the Indian job market. Tailored for portals like Naukri, LinkedIn, and company portals.', price: '₹699', included_features: JSON.stringify(['ATS-friendly India format', 'Naukri & LinkedIn optimised', 'Keyword-rich content', '2 revision rounds', 'PDF + Word format']) },
        { name: 'ATS Resume — International Format', description: 'ATS-optimised resume tailored for international job markets including US, UK, Australia, and Ireland. Follows global hiring standards.', price: '₹999', included_features: JSON.stringify(['US / UK / Australia / Ireland format', 'ATS score >90%', 'Tailored for global job portals', 'Cover letter included', '3 revision rounds', 'PDF + Word format']) },
        { name: 'SAP Guidance', description: 'One-on-one guidance session for SAP aspirants. Get clarity on SAP modules, career paths, certifications, and how to land your first SAP role.', price: '₹999', included_features: JSON.stringify(['SAP module selection advice', 'Certification roadmap', 'Resume for SAP roles', 'Interview preparation tips', '60-min session']) },
      ];
      for (const svc of newServices) {
        const exists = await this.prisma.service.findFirst({ where: { name: svc.name } });
        if (!exists) await this.prisma.service.create({ data: svc });
      }
      return;
    }
    const services = [
      { name: 'Basic', description: 'Clean, modern resume for your target role.', price: '₹499', included_features: JSON.stringify(['ATS-friendly template', 'Keyword optimization', '1 revision round', 'PDF + Word format']) },
      { name: 'ATS Pro', description: 'Built to beat every ATS system with 90%+ score.', price: '₹999', included_features: JSON.stringify(['Everything in Basic', 'ATS score >90% guaranteed', 'Cover letter included', '3 revision rounds', 'Action-verb writing']) },
      { name: 'Premium', description: 'The complete career package. Everything included.', price: '₹1,499', included_features: JSON.stringify(['Everything in ATS Pro', 'LinkedIn optimization', 'GitHub profile review', '30-min mock interview', 'Job strategy guide', 'Unlimited revisions', '24hr priority delivery']) },
      { name: '1:1 Career Call', description: 'A 30-minute one-on-one call with our career expert. Get personalised advice on your resume, job search strategy, or interview prep.', price: '₹500', included_features: JSON.stringify(['30-min video/voice call', 'Resume feedback', 'Career roadmap guidance', 'Interview tips', 'Q&A session']) },
    ];
    await this.prisma.service.createMany({ data: services });
  }

  private async seedTestimonials() {
    const count = await this.prisma.testimonial.count();
    if (count > 0) return;
    await this.prisma.testimonial.createMany({
      data: [
        { name: 'Rahul S.', role: 'Frontend Dev @ Zomato', initials: 'RS', color: '#2563eb', bg: '#eff6ff', quote: 'Got 3 interview calls within a week after the ATS resume. The keyword optimisation is next level.', package: 'ATS Resume', published: true },
        { name: 'Priya N.', role: 'Full-Stack @ Razorpay', initials: 'PN', color: '#7c3aed', bg: '#f5f3ff', quote: 'The roadmap took me from beginner to hired in 6 months. I had zero experience before this.', package: 'Premium Package', published: true },
        { name: 'Arjun M.', role: 'Backend @ Flipkart', initials: 'AM', color: '#0891b2', bg: '#ecfeff', quote: 'Found my current job through the job board. The community advice on interview prep was invaluable.', package: 'Basic Resume', published: true },
      ],
    });
  }

  private async seedSettings() {
    // skipDuplicates: inserts new keys only, never overwrites admin-edited values
    await this.prisma.setting.createMany({
      skipDuplicates: true,
      data: [
        // Stats
        { key: 'stat_community',    value: '60K+',   label: 'Community (hero badge + stats)', description: 'Shown as "Trusted by X developers & students" on homepage' },
        { key: 'stat_resumes',      value: '1,200+', label: 'Resumes Optimised',              description: 'Number of resumes optimised, shown in stats strip' },
        { key: 'stat_hired',        value: '500+',   label: 'Jobs Landed',                    description: 'Number of people hired, shown in stats strip and CTA' },
        { key: 'stat_satisfaction', value: '98%',    label: 'Client Satisfaction',            description: 'Satisfaction percentage shown in stats strip' },
        // Site identity
        { key: 'site_name',         value: 'TechChampsByRev', label: 'Site Name', description: 'Brand name shown in header, footer, and page titles' },
        { key: 'founder_name',      value: 'Revanth Kalamshetty', label: 'Founder Name', description: 'Used in schema.org metadata' },
        { key: 'site_url',          value: 'https://www.techchampsbyrev.in', label: 'Site URL', description: 'Canonical URL used in SEO metadata' },
        { key: 'site_meta_description', value: 'Browse curated tech jobs, courses, roadmaps and get ATS-optimized resumes. Trusted by 60K+ developers in India.', label: 'Meta Description', description: 'Default SEO meta description for all pages' },
        // Contact
        { key: 'contact_email',     value: 'connectwithrev@gmail.com', label: 'Contact Email', description: 'Public contact email shown in footer and contact page' },
        // Social links
        { key: 'social_instagram_url',    value: 'https://www.instagram.com/techchamps_by.rev/', label: 'Instagram URL', description: 'Instagram profile URL' },
        { key: 'social_instagram_handle', value: '@techchamps_by.rev', label: 'Instagram Handle', description: 'Instagram display handle' },
        { key: 'social_linkedin_url',     value: 'https://www.linkedin.com/in/revanthkalamshetty/', label: 'LinkedIn URL', description: 'LinkedIn profile URL' },
        { key: 'social_linkedin_handle',  value: 'revanthkalamshetty', label: 'LinkedIn Handle', description: 'LinkedIn display handle' },
        { key: 'social_youtube_url',      value: 'https://www.youtube.com/@RevanthKalamshetty', label: 'YouTube URL', description: 'YouTube channel URL' },
        { key: 'social_youtube_handle',   value: '@RevanthKalamshetty', label: 'YouTube Handle', description: 'YouTube display handle' },
        { key: 'social_github_url',       value: 'https://github.com/Revs123456', label: 'GitHub URL', description: 'GitHub profile URL' },
        { key: 'social_github_handle',    value: 'Revs123456', label: 'GitHub Handle', description: 'GitHub display handle' },
        { key: 'social_whatsapp_url',     value: 'https://wa.me/917671008062', label: 'WhatsApp URL', description: 'WhatsApp chat link' },
        // Payments
        { key: 'slot_booking_price', value: '500', label: 'Slot Booking Price (₹)', description: 'Price in INR charged for booking a 1:1 slot' },
        // Auth (stored for visibility; app falls back to these if not set)
        { key: 'jwt_access_expiry',      value: '15m', label: 'JWT Access Token Expiry', description: 'e.g. 15m, 1h — how long the access token is valid' },
        { key: 'refresh_token_ttl_days', value: '30',  label: 'Refresh Token TTL (days)', description: 'How many days a refresh token stays valid' },
        // Rate limits (stored for visibility; actual enforcement is in NestJS decorators)
        { key: 'rate_limit_global',    value: '30', label: 'Global Rate Limit (req/min)', description: 'Max requests per IP per minute across all endpoints' },
        { key: 'rate_limit_login',     value: '5',  label: 'Login Rate Limit (req/15min)', description: 'Max login attempts per IP per 15 minutes' },
        { key: 'rate_limit_subscribe', value: '3',  label: 'Subscribe Rate Limit (req/hr)', description: 'Max subscribe attempts per IP per hour' },

        // Announcement banner
        { key: 'announcement_active',    value: 'false',   label: 'Announcement Banner Active', description: 'Set to true to show the announcement banner' },
        { key: 'announcement_text',      value: '🎉 New mock interview batch starting soon! Book your slot now.', label: 'Announcement Text', description: 'Text shown in the announcement banner' },
        { key: 'announcement_bg',        value: '#2563eb', label: 'Announcement Background Color', description: 'CSS color for the banner background' },
        { key: 'announcement_link',      value: '/book',   label: 'Announcement Link URL', description: 'CTA link URL in the banner (optional)' },
        { key: 'announcement_link_text', value: 'Book Now', label: 'Announcement Link Text', description: 'CTA button text in the banner' },

        // Maintenance mode
        { key: 'maintenance_mode',    value: 'false', label: 'Maintenance Mode', description: 'Set to true to show maintenance page to all visitors' },
        { key: 'maintenance_title',   value: "We'll be back soon", label: 'Maintenance Title', description: 'Heading shown on the maintenance page' },
        { key: 'maintenance_message', value: "We're performing scheduled maintenance. Check back in a few minutes.", label: 'Maintenance Message', description: 'Body text on the maintenance page' },

        // Feature flags
        { key: 'feature_mock_interview',  value: 'true', label: 'Feature: Mock Interview',   description: 'Set to false to disable the mock interview page' },
        { key: 'feature_salary_insights', value: 'true', label: 'Feature: Salary Insights',  description: 'Set to false to disable the salary insights page' },
        { key: 'feature_community',       value: 'true', label: 'Feature: Community',        description: 'Set to false to disable the community page' },
        { key: 'feature_ats_checker',     value: 'true', label: 'Feature: ATS Checker',      description: 'Set to false to disable the ATS checker page' },
        { key: 'feature_templates',       value: 'true', label: 'Feature: Resume Templates', description: 'Set to false to disable the templates page' },
        { key: 'feature_success_stories', value: 'true', label: 'Feature: Success Stories',  description: 'Set to false to disable the success stories page' },

        // Homepage hero
        { key: 'hero_line1',               value: 'Land your first tech job',           label: 'Hero Headline Line 1', description: 'First line of the animated headline' },
        { key: 'hero_line2',               value: 'faster with a proven roadmap',       label: 'Hero Headline Line 2', description: 'Second line of the animated headline' },
        { key: 'hero_subheading',          value: 'All-in-one platform to learn skills, build your resume, and get hired faster.', label: 'Hero Subheading', description: 'Paragraph below the headline' },
        { key: 'hero_cta_primary_label',   value: 'Browse Jobs',                        label: 'Hero CTA Primary Label', description: 'Primary CTA button text' },
        { key: 'hero_cta_primary_href',    value: '/jobs',                              label: 'Hero CTA Primary URL', description: 'Primary CTA button link' },
        { key: 'hero_cta_secondary_label', value: 'Checkout our Services',              label: 'Hero CTA Secondary Label', description: 'Secondary CTA button text' },
        { key: 'hero_cta_secondary_href',  value: '/services',                          label: 'Hero CTA Secondary URL', description: 'Secondary CTA button link' },

        // Page hero sections
        { key: 'page_jobs_title',              value: 'Find your next tech role',          label: 'Jobs Page Title', description: 'H1 on the jobs page' },
        { key: 'page_jobs_subtitle',           value: 'Curated opportunities — remote and onsite.', label: 'Jobs Page Subtitle', description: 'Subtitle on the jobs page' },
        { key: 'page_courses_title',           value: 'Curated Courses',                   label: 'Courses Page Title', description: 'H1 on the courses page' },
        { key: 'page_courses_subtitle',        value: 'Hand-picked courses from top platforms', label: 'Courses Page Subtitle', description: 'Subtitle on the courses page' },
        { key: 'page_roadmaps_title',          value: 'Career Roadmaps',                   label: 'Roadmaps Page Title', description: 'H1 on the roadmaps page' },
        { key: 'page_roadmaps_subtitle',       value: 'Step-by-step paths to get job-ready', label: 'Roadmaps Page Subtitle', description: 'Subtitle on the roadmaps page' },
        { key: 'page_salary_insights_title',   value: 'Salary Insights',                   label: 'Salary Insights Page Title', description: 'H1 on the salary insights page' },
        { key: 'page_salary_insights_subtitle',value: 'Know your worth before you negotiate', label: 'Salary Insights Page Subtitle', description: 'Subtitle on the salary insights page' },
        { key: 'page_mock_interview_title',    value: 'Book a Mock Interview',             label: 'Mock Interview Page Title', description: 'H1 on the mock interview page' },
        { key: 'page_mock_interview_subtitle', value: 'Practice with real engineers. Get hired faster.', label: 'Mock Interview Page Subtitle', description: 'Subtitle on mock interview page' },
        { key: 'page_mock_interview_badge',    value: 'Free First Session',                label: 'Mock Interview Badge Text', description: 'Badge shown above the mock interview title' },

        // Footer
        { key: 'footer_tagline', value: 'Helping developers and students launch their tech careers.', label: 'Footer Tagline', description: 'Tagline shown in footer brand section' },

        // SEO
        { key: 'seo_keywords', value: 'tech jobs India,software engineering jobs,ATS resume,coding roadmap,developer career,frontend jobs,backend jobs,DevOps jobs', label: 'SEO Keywords', description: 'Comma-separated meta keywords for all pages' },

        // Navigation (JSON arrays)
        { key: 'nav_main_links', value: '[{"href":"/","label":"Home"},{"href":"/jobs","label":"Jobs"},{"href":"/courses","label":"Courses"},{"href":"/roadmaps","label":"Roadmaps"},{"href":"/services","label":"Services"},{"href":"/community","label":"Community"}]', label: 'Nav Main Links', description: 'JSON array of {href,label} for main nav links' },
        { key: 'nav_more_links', value: '[{"href":"/success-stories","label":"Success Stories"},{"href":"/mock-interview","label":"Mock Interview"}]', label: 'Nav More Links', description: 'JSON array of {href,label} for the More dropdown' },

        // Email templates
        { key: 'email_team_name',                value: 'TechChampsByRev Team',               label: 'Email Team Name', description: 'Sender name shown at the bottom of all emails' },
        { key: 'email_booking_confirmed_subject',value: '✅ Your 1:1 Career Call is Confirmed!', label: 'Email: Booking Confirmed Subject', description: 'Subject line for booking confirmation email' },
        { key: 'email_booking_cancelled_subject',value: '❌ Your 1:1 Call Has Been Cancelled',  label: 'Email: Booking Cancelled Subject', description: 'Subject line for cancellation email' },
        { key: 'email_order_confirmed_subject',  value: '🎉 Order Confirmed — TechChampsByRev', label: 'Email: Order Confirmed Subject', description: 'Subject line for order confirmation email' },

        // Mock interview form options
        { key: 'mock_interview_experience_options', value: 'Fresher,1-3 yrs,3-5 yrs,5+ yrs',         label: 'Mock Interview: Experience Options', description: 'Comma-separated experience level options' },
        { key: 'mock_interview_role_options',       value: 'Frontend,Backend,Full-Stack,DevOps,Mobile', label: 'Mock Interview: Role Options', description: 'Comma-separated target role options' },
        { key: 'mock_interview_stats_label',        value: '100+ Sessions Conducted',                   label: 'Mock Interview: Stats Label', description: 'Bold stats line on mock interview page' },
        { key: 'mock_interview_stats_desc',         value: 'Avg rating 4.8/5 from candidates. 73% received offers within 60 days.', label: 'Mock Interview: Stats Description', description: 'Stats description line' },

        // Pagination
        { key: 'pagination_default_limit', value: '50',  label: 'Pagination Default Limit', description: 'Default page size for list endpoints' },
        { key: 'pagination_max_limit',     value: '200', label: 'Pagination Max Limit', description: 'Maximum allowed page size' },
      ],
    });
  }

  private async seedInterviewQuestions() {
    const count = await this.prisma.interviewQuestion.count();
    if (count > 0) return;
    await this.prisma.interviewQuestion.createMany({
      data: [
        { company: 'Google', role: 'Software Engineer', question: 'Find the longest substring without repeating characters.', answer: 'Use sliding window technique with a HashSet to track characters. Time complexity O(n), Space O(min(n,m)).', difficulty: 'Medium', category: 'DSA', published: true },
        { company: 'Amazon', role: 'SDE-1', question: 'Design a URL shortening service like bit.ly.', answer: 'Use a hash function to generate short codes, store mapping in DB, use Redis for caching frequently accessed URLs. Consider load balancing and rate limiting.', difficulty: 'Hard', category: 'System Design', published: true },
        { company: 'Razorpay', role: 'Frontend Engineer', question: 'Explain the difference between useMemo and useCallback in React.', answer: 'useMemo memoizes a computed value, useCallback memoizes a function reference. Use useMemo to avoid expensive recalculations, useCallback to prevent child component re-renders.', difficulty: 'Medium', category: 'Frontend', published: true },
        { company: 'Flipkart', role: 'Backend Engineer', question: 'How would you design a notification system that handles millions of users?', answer: 'Use message queues (Kafka/RabbitMQ), separate notification service, push via FCM/APNs for mobile, WebSockets for real-time, batch processing for emails.', difficulty: 'Hard', category: 'System Design', published: true },
        { company: 'Zomato', role: 'Any', question: 'Why do you want to join Zomato?', answer: 'Research the company, mention specific products, growth trajectory, tech stack they use. Show genuine interest in food-tech and the scale of problems they solve.', difficulty: 'Easy', category: 'HR', published: true },
        { company: 'Meesho', role: 'SDE-1', question: 'Implement a debounce function in JavaScript.', answer: 'function debounce(fn, delay) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }', difficulty: 'Medium', category: 'Frontend', published: true },
      ],
    });
  }

  private async seedSalaryInsights() {
    const count = await this.prisma.salaryInsight.count();
    if (count > 0) return;
    await this.prisma.salaryInsight.createMany({
      data: [
        { role: 'Frontend Developer', city: 'Bengaluru', experience_level: 'Fresher', min_salary: '₹4 LPA', max_salary: '₹8 LPA', avg_salary: '₹6 LPA', companies: 'Infosys, Wipro, TCS, Startups' },
        { role: 'Frontend Developer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹8 LPA', max_salary: '₹18 LPA', avg_salary: '₹12 LPA', companies: 'Swiggy, Zomato, Razorpay' },
        { role: 'Backend Developer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹8 LPA', max_salary: '₹20 LPA', avg_salary: '₹14 LPA', companies: 'Amazon, Flipkart, CRED' },
        { role: 'Full-Stack Developer', city: 'Remote', experience_level: '3-5 yrs', min_salary: '₹15 LPA', max_salary: '₹30 LPA', avg_salary: '₹22 LPA', companies: 'Startups, Product Companies' },
        { role: 'DevOps Engineer', city: 'Hyderabad', experience_level: '3-5 yrs', min_salary: '₹18 LPA', max_salary: '₹35 LPA', avg_salary: '₹25 LPA', companies: 'Microsoft, Google, Amazon' },
        { role: 'ML Engineer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹12 LPA', max_salary: '₹25 LPA', avg_salary: '₹18 LPA', companies: 'Google, Microsoft, DataMinds' },
      ],
    });
  }

  private async seedDailyTips() {
    const count = await this.prisma.dailyTip.count();
    if (count > 0) return;
    await this.prisma.dailyTip.createMany({
      data: [
        { tip: 'Tailor your resume for every job application. Match keywords from the job description to pass ATS filters.', category: 'Resume', active: true },
        { tip: 'Practice at least one DSA problem daily on LeetCode. Consistency beats intensity.', category: 'DSA', active: true },
        { tip: 'Your LinkedIn headline should say what you do and who you help — not just your job title.', category: 'Career', active: true },
        { tip: 'In interviews, always explain your thought process aloud before writing code. Interviewers value communication.', category: 'Interview', active: true },
        { tip: 'Use the STAR method (Situation, Task, Action, Result) for all behavioral interview questions.', category: 'Interview', active: true },
        { tip: 'Build at least one full-stack project and deploy it. A live URL on your resume is worth more than 10 tutorial projects.', category: 'Career', active: true },
        { tip: 'Learn Git properly — branching, rebasing, and pull requests. It is the #1 collaboration tool in every tech company.', category: 'Career', active: true },
      ],
    });
  }

  private async seedRoadmaps() {
    // Remove duplicates — keep the one with steps, or the latest
    const all = await this.prisma.roadmap.findMany({ orderBy: { created_at: 'asc' } });
    const seen = new Map<string, string>();
    for (const rm of all) {
      const key = rm.title.toLowerCase().trim();
      if (seen.has(key)) {
        await this.prisma.roadmap.delete({ where: { id: seen.get(key)! } });
      }
      seen.set(key, rm.id);
    }

    const count = await this.prisma.roadmap.count();
    if (count > 0) return;
    await this.prisma.roadmap.createMany({
      data: [
        { title: 'Frontend Developer', description: 'Go from zero to a job-ready frontend developer.', color: '#2563eb', icon: 'Globe', published: true, steps: [{ s: 'Internet Basics', d: 'DNS, HTTP, browsers' }, { s: 'HTML & CSS', d: 'Semantics, Flexbox, Grid' }, { s: 'JavaScript ES6+', d: 'DOM, async/await, modules' }, { s: 'React / Next.js', d: 'Components, hooks, App Router' }, { s: 'State Management', d: 'Zustand, Redux Toolkit' }, { s: 'Tailwind CSS', d: 'Utility-first styling' }, { s: 'API Integration', d: 'REST, GraphQL, React Query' }, { s: 'Testing & Deploy', d: 'Jest, Cypress, Vercel' }] },
        { title: 'Backend Developer', description: 'Build scalable APIs and master server-side systems.', color: '#059669', icon: 'Server', published: true, steps: [{ s: 'OS & Networking', d: 'Linux, TCP/IP, HTTP' }, { s: 'Node.js / Python', d: 'Server runtimes, async' }, { s: 'SQL Databases', d: 'PostgreSQL, MySQL, ORM' }, { s: 'NoSQL Databases', d: 'MongoDB, Redis' }, { s: 'REST & GraphQL', d: 'Express, NestJS, Fastify' }, { s: 'Authentication', d: 'JWT, OAuth 2.0' }, { s: 'Caching & Queues', d: 'Redis, BullMQ' }, { s: 'Docker & CI/CD', d: 'Containers, GitHub Actions' }] },
        { title: 'DevOps Engineer', description: 'Bridge dev and ops — master cloud and automation.', color: '#7c3aed', icon: 'Cloud', published: true, steps: [{ s: 'Linux Fundamentals', d: 'Shell, permissions' }, { s: 'Networking', d: 'TCP/IP, DNS, proxies' }, { s: 'Git & VCS', d: 'Branching, GitHub Flow' }, { s: 'Docker', d: 'Dockerfiles, Compose' }, { s: 'CI/CD Pipelines', d: 'GitHub Actions, GitLab CI' }, { s: 'Infra as Code', d: 'Terraform, Ansible' }, { s: 'Kubernetes', d: 'Pods, services, Helm' }, { s: 'Cloud Provider', d: 'AWS / GCP / Azure' }] },
      ],
    });
  }
}
