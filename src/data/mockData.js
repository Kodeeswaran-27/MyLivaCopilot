// All mock/sample data lives here so components stay presentational.
// Swap this out for real API calls later without touching the UI layer.

export const currentUser = {
  name: 'Sriram',
  email: 'sriram@enterprise.com',
  // avatar: '/images/avatars/user-avatar.png',
  fallbackAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sriram&backgroundColor=b6e3f4',
};

export const filterTabs = ['All', 'HR Agent', 'IT Support', 'Sales', 'Finance'];

export const conversations = [
  {
    id: 1,
    icon: 'users',
    iconBg: 'bg-violet-100 text-violet-600',
    title: 'Leave policy for parental leave',
    preview: "Here's the parental leave policy...",
    time: '2 min ago',
    active: true,
    unread: true,
  },
  {
    id: 2,
    icon: 'monitor',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'VPN not connecting on macOS',
    preview: 'Try resetting the network...',
    time: '15 min ago',
    unread: true,
  },
  {
    id: 3,
    icon: 'dollar-sign',
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'Q3 expense report status',
    preview: 'Your expense report was approved...',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: 4,
    icon: 'briefcase',
    iconBg: 'bg-orange-100 text-orange-600',
    title: 'Draft proposal for Acme Corp',
    preview: "I've drafted a proposal...",
    time: '3 hrs ago',
  },
  {
    id: 5,
    icon: 'user-plus',
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Employee handbook update',
    preview: 'The updated handbook covers...',
    time: 'Yesterday',
  },
  {
    id: 6,
    icon: 'monitor',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Password reset request',
    preview: 'Password reset link sent...',
    time: 'Yesterday',
  },
  {
    id: 7,
    icon: 'book-open',
    iconBg: 'bg-teal-100 text-teal-600',
    title: 'Onboarding checklist',
    preview: 'Here is the onboarding...',
    time: '2 days ago',
  },
];

export const sideNavItems = [
  { key: 'agent-analytics', label: 'Agent Analytics', icon: 'bar-chart-2' },
  { key: 'conversations', label: 'Conversations', icon: 'message-circle', active: true },
  { key: 'agents', label: 'Agents', icon: 'sparkles' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export const chatMessages = [
  {
    id: 1,
    role: 'user',
    text: "Hi! Can you tell me about the parental leave policy at our company? I'm planning for next quarter.",
    time: '10:24 AM',
  },
  {
    id: 2,
    role: 'assistant',
    greeting: 'Hello Sriram! 👋 Here\u2019s a summary of our parental leave policy:',
    bullets: [
      { label: 'Primary caregiver', value: '16 weeks paid leave' },
      { label: 'Secondary caregiver', value: '6 weeks paid leave' },
      { label: 'Eligibility', value: 'Employees with 12+ months of service' },
      { label: 'Notice period', value: 'Submit request at least 30 days in advance' },
    ],
    source: { label: 'Employee Handbook 2026', section: 'Section 4.2' },
    time: '10:24 AM',
  },
  {
    id: 3,
    role: 'user',
    text: "Great, thanks! What's the process to apply for it? And who approves my request?",
    time: '10:25 AM',
  },
  {
    id: 4,
    role: 'assistant',
    greeting: "Here's the step-by-step application process:",
    steps: [
      'Submit request via Workday → HR Portal → Leave Requests',
      'Attach supporting documents (medical certificate or adoption papers)',
      'Your direct manager reviews within 3 business days',
      'HR Business Partner provides final approval',
      "You'll receive confirmation via email",
    ],
    quickActions: ['Open Workday', 'Download form', 'Notify manager'],
    meta: { retrieved: '2 sources', responseTime: '1.8s', confidence: '98%' },
    time: '10:26 AM',
  },
  {
    id: 5,
    role: 'user',
    text: 'Perfect. Can you draft an email to my manager letting them know?',
    time: '10:26 AM',
  },
  {
    id: 6,
    role: 'assistant',
    greeting: "Sure! Here's a draft you can review:",
    email: {
      to: 'Anna Carmina (Manager)',
      subject: 'Parental Leave Notification',
      body:
        'Hi Anna,\n\nI wanted to inform you that I plan to take parental leave starting [date]. Per company policy, I\u2019ll submit the formal request via Workday shortly. Happy to discuss handover plans at your convenience.\n\nThanks,\nSriram',
    },
    time: '10:26 AM',
  },
];

// export const suggestedPrompts = [
//   'Check my leave balance',
//   'Update emergency contact',
//   'Insurance benefits',
//   'Learning stipend',
// ];

export const referencedDocuments = [
  {
    id: 1,
    name: 'Employee_Handbook_2026.pdf',
    meta: 'Section 4.2',
    type: 'pdf',
  },
  {
    id: 2,
    name: 'Leave_Policy_v3.docx',
    meta: 'Updated Apr 12, 2024',
    type: 'doc',
  },
  {
    id: 3,
    name: 'Workday_Quickstart.pdf',
    meta: 'Updated Mar 5, 2024',
    type: 'pdf',
  },
];

export const relatedAgents = [
  {
    id: 1,
    name: 'Benefits Assistant',
    desc: 'Benefits & Insurance',
    color: 'bg-violet-100 text-violet-600',
    online: true,
  },
  {
    id: 2,
    name: 'Payroll Assistant',
    desc: 'Compensation & Payroll',
    color: 'bg-emerald-100 text-emerald-600',
    online: true,
  },
];

export const sessionInsights = {
  messages: 6,
  duration: '2m 14s',
  sentiment: 'Positive',
  tokens: '1,240',
};
