import { Injectable } from "@nestjs/common";

const FAQS: { patterns: string[]; answer: string }[] = [
  { patterns: ['job', 'jobs', 'hiring', 'openings', 'vacancy', 'apply'],          answer: 'Browse all current job openings on our Jobs page at /jobs. We update listings daily from top companies!' },
  { patterns: ['course', 'courses', 'learn', 'learning', 'tutorial', 'training'], answer: 'Check out our Courses page at /courses — curated programs for web dev, data science, cloud, and more.' },
  { patterns: ['roadmap', 'roadmaps', 'career path', 'path', 'guide', 'plan'],    answer: 'Our Roadmaps at /roadmaps offer step-by-step learning paths for frontend, backend, DevOps, AI, and more.' },
  { patterns: ['interview', 'mock interview', 'interview questions'],              answer: 'Prepare with our Mock Interview at /mock-interview or browse Interview Questions at /interview-questions.' },
  { patterns: ['mentor', 'mentorship', 'service', 'coaching', '1:1'],             answer: 'We offer 1:1 mentorship & career coaching. Explore Services at /services or book at /book.' },
  { patterns: ['salary', 'pay', 'compensation', 'wage', 'ctc'],                   answer: 'Explore Salary Insights at /salary-insights — compare pay across roles, companies, and cities.' },
  { patterns: ['community', 'forum', 'connect', 'network'],                       answer: 'Join our Community at /community — connect with peers, share wins, and grow together.' },
  { patterns: ['blog', 'blogs', 'article', 'read', 'post'],                       answer: 'Read career guides and tech deep-dives on our Blog at /blogs.' },
  { patterns: ['contact', 'reach', 'support', 'help', 'email'],                  answer: 'Reach us via the Contact page at /contact. We reply within 24 hours.' },
  { patterns: ['template', 'templates', 'resume template'],                       answer: 'Download ATS-ready Resume Templates at /templates — built to impress recruiters.' },
  { patterns: ['tip', 'tips', 'daily tip'],                                        answer: 'Get bite-sized daily advice on our Daily Tips page at /daily-tips.' },
  { patterns: ['success', 'success story', 'placed', 'got job'],                  answer: 'Get inspired by real placement stories at /success-stories!' },
  { patterns: ['hi', 'hello', 'hey', 'hii', 'howdy'],                             answer: "Hi there! I'm your Tech Career Hub assistant. Ask me about jobs, courses, roadmaps, resume tips, interviews, or mentorship." },
  { patterns: ['bye', 'goodbye', 'thanks', 'thank you'],                          answer: "You're welcome! Best of luck on your tech career journey. Come back anytime!" },
];

@Injectable()
export class ChatService {
  getReply(message: string): string {
    const q = message.toLowerCase().trim();
    for (const faq of FAQS) {
      if (faq.patterns.some((p) => q.includes(p))) return faq.answer;
    }
    return "I'm not sure about that, but feel free to visit our Contact page at /contact and we'll help you out!";
  }
}
