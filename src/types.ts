export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'MEMBER';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export interface Group {
  id: string;
  name: string;
  switchPassword?: string;
  createdDate: string;
  constitution: string;
  logo?: string;
  contact?: string;
  email?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  allowAdminEdit?: boolean;
  allowTreasurerEdit?: boolean;
}

export interface Member {
  id: string;
  groupId: string;
  memberNumber?: string;
  name: string;
  contact: string;
  address?: string;
  aadharNumber?: string;
  joinDate: string;
  photoUrl?: string;
  idIssueDate?: string;
  loginId?: string;
  loginPassword?: string;
  role?: Role;
  authVersion?: number;
}

export interface Collection {
  id: string;
  groupId: string;
  memberId: string;
  year: number;
  month: number;
  amount: number;
}

export type TransactionType = 'Income' | 'Expense';
export type PaymentMode = 'Cash' | 'Online' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface Transaction {
  id: string;
  groupId: string;
  memberId?: string;
  date: string;
  particulars: string;
  type: TransactionType;
  paymentMode: PaymentMode;
  payIn: number;
  payOut: number;
  cashInHand: number;
  cashInBank: number;
  runningBalance: number;
}

export interface Loan {
  id: string;
  groupId: string;
  memberId: string;
  principal: number;
  interestRate: number; // monthly %
  loanTerm?: number; // term in months
  issueDate: string;
  dueDate?: string;
  status: 'Active' | 'Repaid';
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  date: string;
  principalAmount: number;
  interestAmount: number;
}

export interface Resolution {
  id: string;
  groupId: string;
  date: string;
  text: string;
}

export interface Notice {
  id: string;
  groupId: string;
  date: string;
  title: string;
  content: string;
}

export interface Activity {
  id: string;
  groupId: string;
  date: string;
  title: string;
  description: string;
  participants: number;
  cost: number;
  photoUrls?: string[];
}

export interface Feedback {
  id: string;
  userId: string;
  groupId: string; // 'GLOBAL' if no group selected
  date: string;
  type: 'Bug' | 'Feature Request' | 'Other';
  text: string;
  status: 'Open' | 'Closed';
}
