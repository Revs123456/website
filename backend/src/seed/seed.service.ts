import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Course } from '../courses/entities/course.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Service } from '../services/entities/service.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { InterviewQuestion } from '../interview-questions/entities/interview-question.entity';
import { SalaryInsight } from '../salary-insights/entities/salary-insight.entity';
import { DailyTip } from '../daily-tips/entities/daily-tip.entity';
import { Roadmap } from '../roadmaps/entities/roadmap.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(Testimonial) private testimonialRepo: Repository<Testimonial>,
    @InjectRepository(InterviewQuestion) private interviewQuestionRepo: Repository<InterviewQuestion>,
    @InjectRepository(SalaryInsight) private salaryInsightRepo: Repository<SalaryInsight>,
    @InjectRepository(DailyTip) private dailyTipRepo: Repository<DailyTip>,
    @InjectRepository(Roadmap) private roadmapRepo: Repository<Roadmap>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
    await this.seedJobs();
    await this.seedCourses();
    await this.seedBlogs();
    await this.seedServices();
    await this.seedSettings();
    await this.seedTestimonials();
    await this.seedInterviewQuestions();
    await this.seedSalaryInsights();
    await this.seedDailyTips();
    await this.seedRoadmaps();
  }

  private async seedAdmin() {
    const count = await this.adminRepo.count();
    if (count > 0) return;
    await this.adminRepo.save({
      email: 'admin@techcareerhub.in',
      passwordHash: 'admin@123',
    });
  }

  private async seedJobs() {
    const count = await this.jobRepo.count();
    if (count > 0) return;
    const jobs = [
      {
        title: 'Senior React Developer', company: 'TechCorp', location: 'Remote',
        experience: '4–6 yrs', type: 'Full-time', category: 'Frontend', salary: '₹18–25 LPA',
        description: "We're looking for a Senior React Developer to join our fully-remote engineering team. You'll own the frontend architecture of our core product used by 100K+ users daily.\n\nYou'll work closely with designers and backend engineers to ship features that matter.",
        requirements: JSON.stringify(['Strong TypeScript and React skills', 'Experience with Next.js App Router', 'State management (Zustand or Redux Toolkit)', 'REST and GraphQL API integration', 'CI/CD and testing (Jest, Playwright)']),
        benefits: JSON.stringify(['Fully remote', 'Health & dental insurance', 'Stock options', '30 days PTO', '₹50K/yr learning budget']),
        tech_stack: JSON.stringify(['React 18', 'Next.js 14', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest']),
        apply_link: '#',
      },
      {
        title: 'Backend Engineer (Node.js)', company: 'InnovateHub', location: 'Bengaluru',
        experience: '2–4 yrs', type: 'Full-time', category: 'Backend', salary: '₹12–18 LPA',
        description: 'Join our backend team to build scalable microservices. You will design APIs, optimize database queries, and ensure system reliability at scale.',
        requirements: JSON.stringify(['Node.js and Express/NestJS expertise', 'PostgreSQL and MongoDB experience', 'Docker and Kubernetes basics', 'REST API design best practices']),
        benefits: JSON.stringify(['Flexible hours', 'Remote-friendly', 'Gym allowance', 'Annual bonus']),
        tech_stack: JSON.stringify(['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'TypeScript']),
        apply_link: '#',
      },
      {
        title: 'DevOps Engineer', company: 'CloudWorks', location: 'Remote',
        experience: '3–5 yrs', type: 'Contract', category: 'DevOps', salary: '₹20–30 LPA',
        description: 'We need an experienced DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Terraform, and Kubernetes.',
        requirements: JSON.stringify(['AWS or GCP expertise', 'Terraform and Ansible', 'Kubernetes cluster management', 'CI/CD with GitHub Actions', 'Linux systems administration']),
        benefits: JSON.stringify(['Remote work', 'Competitive hourly rate', 'Flexible schedule', 'Latest equipment']),
        tech_stack: JSON.stringify(['AWS', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Docker']),
        apply_link: '#',
      },
      {
        title: 'Frontend Intern', company: 'StartupUI', location: 'Remote',
        experience: 'Fresher', type: 'Internship', category: 'Frontend', salary: '₹8–12K/mo',
        description: 'Great opportunity for freshers to gain real-world experience building modern web interfaces with React and Tailwind CSS.',
        requirements: JSON.stringify(['Basic HTML, CSS, JavaScript', 'Familiarity with React', 'Good communication skills', 'Eagerness to learn']),
        benefits: JSON.stringify(['Remote internship', 'Certificate on completion', 'Pre-placement offer opportunity', 'Mentorship from seniors']),
        tech_stack: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'React']),
        apply_link: '#',
      },
      {
        title: 'Full-Stack Engineer', company: 'ScaleHQ', location: 'Hyderabad',
        experience: '3–6 yrs', type: 'Full-time', category: 'Full-Stack', salary: '₹15–22 LPA',
        description: 'Build end-to-end features on our SaaS platform. You will work across the React frontend and Node.js backend, contributing to a product used by thousands.',
        requirements: JSON.stringify(['React and Node.js expertise', 'Database design (PostgreSQL/MongoDB)', 'REST API development', 'Git and agile workflows', 'Testing and code review experience']),
        benefits: JSON.stringify(['Hybrid work model', 'Health insurance', 'ESOP', 'Annual tech allowance']),
        tech_stack: JSON.stringify(['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS']),
        apply_link: '#',
      },
      {
        title: 'ML Engineer', company: 'DataMinds', location: 'Remote',
        experience: '2–4 yrs', type: 'Full-time', category: 'AI/ML', salary: '₹20–35 LPA',
        description: 'Work on cutting-edge machine learning models for NLP and computer vision. Collaborate with data scientists to take models from research to production.',
        requirements: JSON.stringify(['Python expertise', 'TensorFlow or PyTorch', 'MLOps experience', 'Strong statistics background', 'Cloud ML platforms (AWS/GCP)']),
        benefits: JSON.stringify(['Fully remote', 'Research paper budget', 'Conference allowance', 'Competitive salary']),
        tech_stack: JSON.stringify(['Python', 'TensorFlow', 'PyTorch', 'AWS SageMaker', 'Docker']),
        apply_link: '#',
      },
    ];
    await this.jobRepo.save(jobs as any[]);
  }

  private async seedCourses() {
    // Remove duplicate courses (same title, keep latest)
    const allCourses = await this.courseRepo.find({ order: { created_at: 'ASC' } });
    const seen = new Map<string, string>();
    for (const course of allCourses) {
      if (seen.has(course.title)) {
        await this.courseRepo.delete(seen.get(course.title)!);
      }
      seen.set(course.title, course.id);
    }

    const count = await this.courseRepo.count();
    if (count > 0) return;
    const courses = [
      {
        title: 'Complete React & Next.js Bootcamp', platform: 'Udemy', category: 'Frontend',
        duration: '40h', level: 'Beginner', instructor: 'Maximilian Schwarzmüller',
        rating: 4.8, students: '120K', price: '₹499',
        description: 'Master React 18, Next.js 14, TypeScript, Redux Toolkit, and Tailwind CSS. The most comprehensive React course available — from fundamentals to production-ready full-stack apps.',
        modules: JSON.stringify(['React Fundamentals & Hooks', 'Next.js App Router', 'Styling with Tailwind CSS', 'State Management', 'Database Integration (Prisma)', 'Authentication & Authorization', 'Performance Optimization', 'Deployment & CI/CD']),
        course_link: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/',
      },
      {
        title: 'Kubernetes for Developers', platform: 'Coursera', category: 'DevOps',
        duration: '15h', level: 'Intermediate', instructor: 'Google Cloud',
        rating: 4.7, students: '45K', price: '₹799',
        description: 'Learn Kubernetes from the ground up. This course covers pods, deployments, services, Helm charts, and running production-grade workloads on Kubernetes.',
        modules: JSON.stringify(['Container Basics', 'Pods & Deployments', 'Services & Networking', 'ConfigMaps & Secrets', 'Helm Charts', 'Kubernetes on GKE', 'Monitoring & Logging']),
        course_link: 'https://www.coursera.org/learn/google-kubernetes-engine',
      },
      {
        title: 'Machine Learning A-Z', platform: 'Udemy', category: 'AI/ML',
        duration: '45h', level: 'Beginner', instructor: 'Kirill Eremenko',
        rating: 4.6, students: '200K', price: '₹499',
        description: 'The most complete Machine Learning course on Udemy. Covers supervised, unsupervised learning, NLP, deep learning — all in Python and R.',
        modules: JSON.stringify(['Python & R basics', 'Data Preprocessing', 'Regression', 'Classification', 'Clustering', 'NLP', 'Deep Learning with TensorFlow', 'Model Deployment']),
        course_link: 'https://www.udemy.com/course/machinelearning/',
      },
      {
        title: 'NestJS: The Complete Developer\'s Guide', platform: 'Udemy', category: 'Backend',
        duration: '25h', level: 'Intermediate', instructor: 'Stephen Grider',
        rating: 4.8, students: '55K', price: '₹499',
        description: 'Build full-stack applications with NestJS and TypeORM. Covers Guards, Interceptors, Microservices, GraphQL, and enterprise-grade REST APIs.',
        modules: JSON.stringify(['NestJS Architecture', 'Modules & Providers', 'Guards & Interceptors', 'TypeORM Integration', 'Authentication with JWT', 'Testing NestJS Apps', 'Deployment']),
        course_link: 'https://www.udemy.com/course/nestjs-the-complete-developers-guide/',
      },
      {
        title: 'TypeScript: The Complete Guide', platform: 'Udemy', category: 'Frontend',
        duration: '28h', level: 'Intermediate', instructor: 'Stephen Grider',
        rating: 4.8, students: '85K', price: '₹499',
        description: 'A comprehensive guide to TypeScript including types, interfaces, generics, decorators, and integrating TypeScript with React and Node.js.',
        modules: JSON.stringify(['Type Annotations', 'Interfaces & Classes', 'Generics', 'Decorators', 'TypeScript with React', 'TypeScript with Node.js', 'Advanced Patterns']),
        course_link: 'https://www.udemy.com/course/typescript-the-complete-developers-guide/',
      },
      {
        title: 'AWS Solutions Architect', platform: 'Coursera', category: 'DevOps',
        duration: '35h', level: 'Advanced', instructor: 'Amazon Web Services',
        rating: 4.7, students: '60K', price: '₹999',
        description: 'Prepare for the AWS Solutions Architect Associate exam. Covers EC2, S3, RDS, Lambda, VPC, IAM, and cloud architecture best practices.',
        modules: JSON.stringify(['AWS Fundamentals', 'EC2 & Auto Scaling', 'S3 & CloudFront', 'RDS & DynamoDB', 'Lambda & Serverless', 'VPC & Networking', 'IAM & Security', 'Exam Prep']),
        course_link: 'https://www.coursera.org/learn/aws-certified-solutions-architect-associate',
      },
      {
        title: 'Full Stack Web Development Bootcamp', platform: 'YouTube', category: 'Full-Stack',
        duration: '12h', level: 'Beginner', instructor: 'Traversy Media',
        rating: 4.7, students: '500K', price: '',
        description: 'A complete free bootcamp covering HTML, CSS, JavaScript, Node.js, Express, MongoDB and React from scratch. Perfect for beginners.',
        modules: JSON.stringify(['HTML & CSS Basics', 'JavaScript Essentials', 'DOM Manipulation', 'Node.js & Express', 'MongoDB & Mongoose', 'React Fundamentals', 'Building & Deploying']),
        course_link: 'https://www.youtube.com/watch?v=f2EqECiTBL8',
      },
      {
        title: 'Git & GitHub for Beginners', platform: 'YouTube', category: 'DevOps',
        duration: '3h', level: 'Beginner', instructor: 'freeCodeCamp',
        rating: 4.9, students: '2M', price: '',
        description: 'Learn Git version control and GitHub from scratch. Covers commits, branches, pull requests, merging, and collaboration workflows.',
        modules: JSON.stringify(['Git Basics', 'Branching & Merging', 'Remote Repositories', 'Pull Requests', 'GitHub Workflows', 'Resolving Conflicts']),
        course_link: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      },
      {
        title: 'Python for Everybody', platform: 'Coursera', category: 'Backend',
        duration: '30h', level: 'Beginner', instructor: 'Dr. Charles Severance',
        rating: 4.8, students: '1.2M', price: '',
        description: 'Learn Python from scratch with this popular Coursera specialization. Covers data structures, web scraping, databases, and data visualization.',
        modules: JSON.stringify(['Python Basics', 'Data Structures', 'Using Python to Access Web Data', 'Using Databases with Python', 'Capstone Project']),
        course_link: 'https://www.coursera.org/specializations/python',
      },
      {
        title: 'CSS Full Course - Flexbox & Grid', platform: 'YouTube', category: 'Frontend',
        duration: '11h', level: 'Beginner', instructor: 'Dave Gray',
        rating: 4.8, students: '800K', price: '',
        description: 'A comprehensive free CSS course covering Flexbox, Grid, animations, responsive design, and modern CSS features.',
        modules: JSON.stringify(['CSS Selectors', 'Box Model', 'Flexbox Layout', 'CSS Grid', 'Responsive Design', 'Animations & Transitions', 'CSS Variables']),
        course_link: 'https://www.youtube.com/watch?v=OXGznpKZ_sA',
      },
    ];
    await this.courseRepo.save(courses as any[]);
  }

  private async seedBlogs() {
    const count = await this.blogRepo.count();
    if (count > 0) return;
    const blogs = [
      {
        title: 'How to Write an ATS-Optimized Resume in 2025',
        category: 'Resume Tips',
        author: 'Priya Sharma',
        read_time: '8 min read',
        summary: "Applicant Tracking Systems scan your resume before a human ever sees it. Here's how to beat them with the right keywords, formatting, and structure.",
        content: `## Why ATS Matters\n\nOver 90% of Fortune 500 companies use Applicant Tracking Systems to filter resumes before they reach a recruiter. If your resume isn't ATS-friendly, it may never be seen.\n\n## Key Strategies\n\n**1. Use relevant keywords**\nMatch your resume to the job description. Use the exact phrases and skills mentioned in the listing.\n\n**2. Clean formatting**\nAvoid tables, columns, headers/footers, and fancy fonts. Stick to a single-column layout with standard headings.\n\n**3. Use standard section headings**\nUse headings like "Work Experience", "Education", "Skills" — not creative alternatives like "My Journey" or "What I've Built".\n\n**4. Quantify achievements**\nInstead of "improved performance", write "reduced page load time by 40%".\n\n**5. Save as PDF or DOCX**\nMost ATS systems handle both, but check the job posting for preferences.\n\n## Checklist\n- [ ] Keywords from job description included\n- [ ] Single-column layout\n- [ ] Standard section headings\n- [ ] Achievements quantified\n- [ ] Saved in correct format`,
        cover_image: '',
        published: true,
      },
      {
        title: 'Frontend vs Backend vs Full-Stack: Which Path is Right for You?',
        category: 'Career Advice',
        author: 'Rahul Verma',
        read_time: '6 min read',
        summary: 'Choosing your specialization is one of the most important early career decisions. This guide breaks down each path so you can make the right choice.',
        content: `## The Three Paths\n\n### Frontend Development\nFrontend developers build what users see and interact with. You'll work with HTML, CSS, JavaScript, and frameworks like React or Vue.\n\n**Pros:** Creative work, visual results, high demand\n**Cons:** Browser compatibility, keeping up with evolving tools\n\n**Key skills:** React/Vue, TypeScript, CSS, responsive design\n\n### Backend Development\nBackend developers build the server, APIs, and database layer. You'll work with Node.js, Python, or Java, plus databases like PostgreSQL.\n\n**Pros:** High salaries, stable foundations, logic-focused\n**Cons:** Less visual feedback, complex architecture decisions\n\n**Key skills:** Node.js/Python, SQL, REST/GraphQL APIs, Docker\n\n### Full-Stack Development\nFull-stack developers work on both frontend and backend. You need broader knowledge but have more flexibility.\n\n**Pros:** Versatile, can build complete products, high demand at startups\n**Cons:** Depth vs breadth tradeoff, more to learn\n\n## Which Should You Choose?\n\n- If you love visual design and UX → **Frontend**\n- If you love systems, data, and logic → **Backend**\n- If you want flexibility or work at startups → **Full-Stack**`,
        cover_image: '',
        published: true,
      },
      {
        title: '10 GitHub Profile Tips That Will Get You Hired',
        category: 'Job Search',
        author: 'Arjun Mehta',
        read_time: '5 min read',
        summary: 'Your GitHub profile is your developer portfolio. Recruiters check it. Here are 10 actionable tips to make yours stand out.',
        content: "## Why Your GitHub Profile Matters\n\nFor developers, GitHub is often more important than a resume. It shows real work, not just claims.\n\n## 10 Tips\n\n**1. Write a great README profile**\nCreate a `username/username` repo with a README. Include your skills, what you're working on, and contact info.\n\n**2. Pin your best repositories**\nPin 6 repositories that showcase your best work. Include a clear description for each.\n\n**3. Add README files to all pinned repos**\nEvery pinned project should have a README with: what it does, tech stack, how to run it, screenshots.\n\n**4. Keep your contribution graph green**\nConsistent contributions signal active development. Aim to commit code daily, even if it's small.\n\n**5. Contribute to open source**\nEven small contributions to popular projects signal expertise and collaboration skills.\n\n**6. Use descriptive commit messages**\nWrite clear commit messages like \"fix: resolve login redirect issue\" not \"fix stuff\".\n\n**7. Organize your code cleanly**\nUse proper folder structure, follow naming conventions, add .gitignore files.\n\n**8. Add topics/tags to repos**\nTag repos with relevant topics so they appear in GitHub search.\n\n**9. Star relevant repos**\nYour starred repos show your interests to potential employers.\n\n**10. Connect GitHub to LinkedIn**\nAdd your GitHub URL to your LinkedIn profile and resume.",
        cover_image: '',
        published: true,
      },
      {
        title: 'The Complete Guide to Cracking Tech Interviews in India',
        category: 'Interview Prep',
        author: 'Sneha Patel',
        read_time: '10 min read',
        summary: 'From DSA to system design to HR rounds — everything you need to know to crack interviews at top Indian tech companies.',
        content: `## The Indian Tech Interview Process\n\nMost tech companies in India follow a 3-5 round interview process:\n1. Online Assessment (DSA)\n2. Technical Round 1 (DSA + Problem Solving)\n3. Technical Round 2 (System Design or Project Discussion)\n4. HR / Culture Fit\n\n## Data Structures & Algorithms\n\nDSA is the most important part. Focus on:\n- Arrays and Strings\n- Linked Lists\n- Trees and Graphs\n- Dynamic Programming\n- Searching and Sorting\n\n**Resources:** LeetCode, GeeksForGeeks, Striver's A-Z DSA Sheet\n\n## System Design\n\nFor 3+ years experience, expect system design questions. Study:\n- Load balancers, CDNs\n- Database sharding and replication\n- Caching strategies (Redis)\n- Microservices vs monoliths\n- Message queues (Kafka, RabbitMQ)\n\n## Project Discussion\n\nBe ready to explain your projects in detail:\n- Why you made certain technology choices\n- Challenges you faced and how you solved them\n- How you would scale it\n\n## Companies to Target (2025)\n\n- **FAANG equivalent:** Google, Microsoft, Amazon, Meta\n- **Indian unicorns:** Razorpay, CRED, Zepto, Meesho\n- **Startups:** Hundreds of well-funded companies hiring aggressively`,
        cover_image: '',
        published: true,
      },
    ];
    await this.blogRepo.save(blogs as any[]);
  }

  private async seedServices() {
    const count = await this.serviceRepo.count();
    if (count > 0) {
      const newServices = [
        {
          name: '1:1 Career Call',
          description: 'A 30-minute one-on-one call with our career expert. Get personalised advice on your resume, job search strategy, or interview prep.',
          price: '₹500',
          included_features: JSON.stringify(['30-min video/voice call', 'Resume feedback', 'Career roadmap guidance', 'Interview tips', 'Q&A session']),
        },
        {
          name: 'Mock Interview',
          description: 'Simulated interview session conducted by an experienced interviewer. Get real-time feedback to boost your confidence before the actual interview.',
          price: '₹799',
          included_features: JSON.stringify(['45-min mock interview session', 'Real-time feedback', 'Strengths & weaknesses report', 'Common mistakes highlighted', 'Follow-up tips']),
        },
        {
          name: 'Recruiter-Level Interview Questions',
          description: 'Curated set of interview questions used by top recruiters, tailored to your target role and company. Includes model answers.',
          price: '₹399',
          included_features: JSON.stringify(['50+ role-specific questions', 'Model answers included', 'Company-specific questions', 'HR round questions', 'PDF format delivery']),
        },
        {
          name: 'ATS Resume — India Format',
          description: 'Professional ATS-optimised resume crafted specifically for the Indian job market. Tailored for portals like Naukri, LinkedIn, and company portals.',
          price: '₹699',
          included_features: JSON.stringify(['ATS-friendly India format', 'Naukri & LinkedIn optimised', 'Keyword-rich content', '2 revision rounds', 'PDF + Word format']),
        },
        {
          name: 'ATS Resume — International Format',
          description: 'ATS-optimised resume tailored for international job markets including US, UK, Australia, and Ireland. Follows global hiring standards.',
          price: '₹999',
          included_features: JSON.stringify(['US / UK / Australia / Ireland format', 'ATS score >90%', 'Tailored for global job portals', 'Cover letter included', '3 revision rounds', 'PDF + Word format']),
        },
        {
          name: 'SAP Guidance',
          description: 'One-on-one guidance session for SAP aspirants. Get clarity on SAP modules, career paths, certifications, and how to land your first SAP role.',
          price: '₹999',
          included_features: JSON.stringify(['SAP module selection advice', 'Certification roadmap', 'Resume for SAP roles', 'Interview preparation tips', '60-min session']),
        },
      ];
      for (const svc of newServices) {
        const exists = await this.serviceRepo.findOne({ where: { name: svc.name } });
        if (!exists) await this.serviceRepo.save(svc as any);
      }
      return;
    }
    const services = [
      {
        name: 'Basic',
        description: 'Clean, modern resume for your target role.',
        price: '₹499',
        included_features: JSON.stringify(['ATS-friendly template', 'Keyword optimization', '1 revision round', 'PDF + Word format']),
      },
      {
        name: 'ATS Pro',
        description: 'Built to beat every ATS system with 90%+ score.',
        price: '₹999',
        included_features: JSON.stringify(['Everything in Basic', 'ATS score >90% guaranteed', 'Cover letter included', '3 revision rounds', 'Action-verb writing']),
      },
      {
        name: 'Premium',
        description: 'The complete career package. Everything included.',
        price: '₹1,499',
        included_features: JSON.stringify(['Everything in ATS Pro', 'LinkedIn optimization', 'GitHub profile review', '30-min mock interview', 'Job strategy guide', 'Unlimited revisions', '24hr priority delivery']),
      },
      {
        name: '1:1 Career Call',
        description: 'A 30-minute one-on-one call with our career expert. Get personalised advice on your resume, job search strategy, or interview prep.',
        price: '₹500',
        included_features: JSON.stringify(['30-min video/voice call', 'Resume feedback', 'Career roadmap guidance', 'Interview tips', 'Q&A session']),
      },
    ];
    await this.serviceRepo.save(services as any[]);
  }

  private async seedTestimonials() {
    const count = await this.testimonialRepo.count();
    if (count > 0) return;
    const testimonials = [
      { name: 'Rahul S.', role: 'Frontend Dev @ Zomato', initials: 'RS', color: '#2563eb', bg: '#eff6ff', quote: 'Got 3 interview calls within a week after the ATS resume. The keyword optimisation is next level.', package: 'ATS Resume', published: true },
      { name: 'Priya N.', role: 'Full-Stack @ Razorpay', initials: 'PN', color: '#7c3aed', bg: '#f5f3ff', quote: 'The roadmap took me from beginner to hired in 6 months. I had zero experience before this.', package: 'Premium Package', published: true },
      { name: 'Arjun M.', role: 'Backend @ Flipkart', initials: 'AM', color: '#0891b2', bg: '#ecfeff', quote: 'Found my current job through the job board. The community advice on interview prep was invaluable.', package: 'Basic Resume', published: true },
    ];
    await this.testimonialRepo.save(testimonials);
  }

  private async seedSettings() {
    const count = await this.settingRepo.count();
    if (count > 0) return;
    const defaults = [
      { key: 'stat_community',   value: '60K+',   label: 'Community (hero badge + stats)', description: 'Shown as "Trusted by X developers & students" on homepage' },
      { key: 'stat_resumes',     value: '1,200+', label: 'Resumes Optimised',              description: 'Number of resumes optimised, shown in stats strip' },
      { key: 'stat_hired',       value: '500+',   label: 'Jobs Landed',                    description: 'Number of people hired, shown in stats strip and CTA' },
      { key: 'stat_satisfaction',value: '98%',    label: 'Client Satisfaction',            description: 'Satisfaction percentage shown in stats strip' },
    ];
    await this.settingRepo.save(defaults);
  }

  private async seedInterviewQuestions() {
    const count = await this.interviewQuestionRepo.count();
    if (count > 0) return;
    const questions = [
      { company: 'Google', role: 'Software Engineer', question: 'Find the longest substring without repeating characters.', answer: 'Use sliding window technique with a HashSet to track characters. Time complexity O(n), Space O(min(n,m)).', difficulty: 'Medium', category: 'DSA', published: true },
      { company: 'Amazon', role: 'SDE-1', question: 'Design a URL shortening service like bit.ly.', answer: 'Use a hash function to generate short codes, store mapping in DB, use Redis for caching frequently accessed URLs. Consider load balancing and rate limiting.', difficulty: 'Hard', category: 'System Design', published: true },
      { company: 'Razorpay', role: 'Frontend Engineer', question: 'Explain the difference between useMemo and useCallback in React.', answer: 'useMemo memoizes a computed value, useCallback memoizes a function reference. Use useMemo to avoid expensive recalculations, useCallback to prevent child component re-renders.', difficulty: 'Medium', category: 'Frontend', published: true },
      { company: 'Flipkart', role: 'Backend Engineer', question: 'How would you design a notification system that handles millions of users?', answer: 'Use message queues (Kafka/RabbitMQ), separate notification service, push via FCM/APNs for mobile, WebSockets for real-time, batch processing for emails.', difficulty: 'Hard', category: 'System Design', published: true },
      { company: 'Zomato', role: 'Any', question: 'Why do you want to join Zomato?', answer: 'Research the company, mention specific products, growth trajectory, tech stack they use. Show genuine interest in food-tech and the scale of problems they solve.', difficulty: 'Easy', category: 'HR', published: true },
      { company: 'Meesho', role: 'SDE-1', question: 'Implement a debounce function in JavaScript.', answer: 'function debounce(fn, delay) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }', difficulty: 'Medium', category: 'Frontend', published: true },
    ];
    await this.interviewQuestionRepo.save(questions);
  }

  private async seedSalaryInsights() {
    const count = await this.salaryInsightRepo.count();
    if (count > 0) return;
    const insights = [
      { role: 'Frontend Developer', city: 'Bengaluru', experience_level: 'Fresher', min_salary: '₹4 LPA', max_salary: '₹8 LPA', avg_salary: '₹6 LPA', companies: 'Infosys, Wipro, TCS, Startups' },
      { role: 'Frontend Developer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹8 LPA', max_salary: '₹18 LPA', avg_salary: '₹12 LPA', companies: 'Swiggy, Zomato, Razorpay' },
      { role: 'Backend Developer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹8 LPA', max_salary: '₹20 LPA', avg_salary: '₹14 LPA', companies: 'Amazon, Flipkart, CRED' },
      { role: 'Full-Stack Developer', city: 'Remote', experience_level: '3-5 yrs', min_salary: '₹15 LPA', max_salary: '₹30 LPA', avg_salary: '₹22 LPA', companies: 'Startups, Product Companies' },
      { role: 'DevOps Engineer', city: 'Hyderabad', experience_level: '3-5 yrs', min_salary: '₹18 LPA', max_salary: '₹35 LPA', avg_salary: '₹25 LPA', companies: 'Microsoft, Google, Amazon' },
      { role: 'ML Engineer', city: 'Bengaluru', experience_level: '1-3 yrs', min_salary: '₹12 LPA', max_salary: '₹25 LPA', avg_salary: '₹18 LPA', companies: 'Google, Microsoft, DataMinds' },
    ];
    await this.salaryInsightRepo.save(insights);
  }

  private async seedDailyTips() {
    const count = await this.dailyTipRepo.count();
    if (count > 0) return;
    const tips = [
      { tip: 'Tailor your resume for every job application. Match keywords from the job description to pass ATS filters.', category: 'Resume', active: true },
      { tip: 'Practice at least one DSA problem daily on LeetCode. Consistency beats intensity.', category: 'DSA', active: true },
      { tip: 'Your LinkedIn headline should say what you do and who you help — not just your job title.', category: 'Career', active: true },
      { tip: 'In interviews, always explain your thought process aloud before writing code. Interviewers value communication.', category: 'Interview', active: true },
      { tip: 'Use the STAR method (Situation, Task, Action, Result) for all behavioral interview questions.', category: 'Interview', active: true },
      { tip: 'Build at least one full-stack project and deploy it. A live URL on your resume is worth more than 10 tutorial projects.', category: 'Career', active: true },
      { tip: 'Learn Git properly — branching, rebasing, and pull requests. It is the #1 collaboration tool in every tech company.', category: 'Career', active: true },
    ];
    await this.dailyTipRepo.save(tips);
  }

  private async seedRoadmaps() {
    // Remove duplicates — keep the one with steps, or the latest
    const all = await this.roadmapRepo.find({ order: { created_at: 'ASC' } });
    const seen = new Map<string, string>();
    for (const rm of all) {
      const key = rm.title.toLowerCase().trim();
      if (seen.has(key)) {
        await this.roadmapRepo.delete(seen.get(key)!);
      }
      seen.set(key, rm.id);
    }

    const count = await this.roadmapRepo.count();
    if (count > 0) return;
    const roadmaps = [
      {
        title: 'Frontend Developer',
        description: 'Go from zero to a job-ready frontend developer.',
        color: '#2563eb',
        icon: 'Globe',
        published: true,
        steps: [
          { s: 'Internet Basics', d: 'DNS, HTTP, browsers' },
          { s: 'HTML & CSS', d: 'Semantics, Flexbox, Grid' },
          { s: 'JavaScript ES6+', d: 'DOM, async/await, modules' },
          { s: 'React / Next.js', d: 'Components, hooks, App Router' },
          { s: 'State Management', d: 'Zustand, Redux Toolkit' },
          { s: 'Tailwind CSS', d: 'Utility-first styling' },
          { s: 'API Integration', d: 'REST, GraphQL, React Query' },
          { s: 'Testing & Deploy', d: 'Jest, Cypress, Vercel' },
        ],
      },
      {
        title: 'Backend Developer',
        description: 'Build scalable APIs and master server-side systems.',
        color: '#059669',
        icon: 'Server',
        published: true,
        steps: [
          { s: 'OS & Networking', d: 'Linux, TCP/IP, HTTP' },
          { s: 'Node.js / Python', d: 'Server runtimes, async' },
          { s: 'SQL Databases', d: 'PostgreSQL, MySQL, ORM' },
          { s: 'NoSQL Databases', d: 'MongoDB, Redis' },
          { s: 'REST & GraphQL', d: 'Express, NestJS, Fastify' },
          { s: 'Authentication', d: 'JWT, OAuth 2.0' },
          { s: 'Caching & Queues', d: 'Redis, BullMQ' },
          { s: 'Docker & CI/CD', d: 'Containers, GitHub Actions' },
        ],
      },
      {
        title: 'DevOps Engineer',
        description: 'Bridge dev and ops — master cloud and automation.',
        color: '#7c3aed',
        icon: 'Cloud',
        published: true,
        steps: [
          { s: 'Linux Fundamentals', d: 'Shell, permissions' },
          { s: 'Networking', d: 'TCP/IP, DNS, proxies' },
          { s: 'Git & VCS', d: 'Branching, GitHub Flow' },
          { s: 'Docker', d: 'Dockerfiles, Compose' },
          { s: 'CI/CD Pipelines', d: 'GitHub Actions, GitLab CI' },
          { s: 'Infra as Code', d: 'Terraform, Ansible' },
          { s: 'Kubernetes', d: 'Pods, services, Helm' },
          { s: 'Cloud Provider', d: 'AWS / GCP / Azure' },
        ],
      },
    ];
    await this.roadmapRepo.save(roadmaps as any[]);
  }
}
