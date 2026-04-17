export interface Group {
  id: string;
  name: string;
  createdDate: string;
  constitution: string;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  contact: string;
  joinDate: string;
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
export type PaymentMode = 'Cash' | 'Online';

export interface Transaction {
  id: string;
  groupId: string;
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
  issueDate: string;
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
}
