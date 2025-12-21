
import React from 'react';
import { CourseWeek, Language } from '../types';

interface CourseDetailProps {
  courseId: number | null;
  content: string;
  courses: CourseWeek[];
  lang: Language;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, content, courses = [], lang }) => {
  const course = courses.find(c => c.id === courseId);

  if (!course) return <div className="p-8 text-center text-textSub">课程未找到</div>;

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 bg-cloud min-h-full rounded-2xl shadow-sm border border-white/50 m-4">
      <h2 className="text-xl font-medium text-textMain mb-2">{course.title}</h2>
      <div className="w-10 h-1 bg-primary mb-6"></div>
      
      {content ? (
        <div className="text-textMain leading-loose text-base space-y-4 whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <div className="text-textSub text-sm leading-loose">
          <p>{lang === 'en' ? '(No course content available. Please add via Admin)' : '（暂无讲稿内容，请管理员在后台添加）'}</p>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
