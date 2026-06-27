'use client';

import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { ExamStartScreen } from '@/components/ExamComponents';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ExamPage() {
  const router = useRouter();
  const startExam = useExamStore((state) => state.startExam);
  const examStatus = useExamStore((state) => state.examStatus);

  const handleStartExam = async () => {
    await startExam(40);
    // Navigate to exam questions after starting
    const examId = useExamStore.getState().examId;
    if (examId) {
      router.push(`/exam/${examId}`);
    }
  };

  return (
    <ProtectedRoute>
      <ExamStartScreen
        totalQuestions={40}
        onStart={handleStartExam}
        isLoading={examStatus === 'starting'}
      />
    </ProtectedRoute>
  );
}
