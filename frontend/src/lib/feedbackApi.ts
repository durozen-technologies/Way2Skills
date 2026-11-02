export type FeedbackStatus = "pending" | "approved" | "rejected";

export type FeedbackRecord = {
  id: string;
  student_name: string;
  course: string;
  rating: number;
  message: string;
  status: FeedbackStatus;
  created_at: string;
};

export type FeedbackPage = {
  items: FeedbackRecord[];
  total: number;
  limit: number;
  offset: number;
};
