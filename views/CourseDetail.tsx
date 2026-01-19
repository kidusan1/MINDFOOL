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

  // 1. 安全保护：如果找不到课程，返回一个优雅的提示
  if (!course) return <div className="p-8 text-center text-textSub font-light">课程未找到</div>;

  return (
    /* 外层容器：锁定高度，禁止全屏滚动 */
    <div className="h-full flex flex-col items-center px-4 overflow-hidden">
      
      {/* 核心卡片 */}
      <div className="w-full flex-1 flex flex-col bg-cloud rounded-[2.5rem] shadow-sm border border-white/50 overflow-hidden mt-4">
        
        {/* A. 标题区：固定高度 */}
        <div className="p-8 pb-4 shrink-0">
          <h2 className="text-xl md:text-2xl font-medium text-textMain mb-2 tracking-wide">
            {course.title}
          </h2>
          <div className="w-10 h-[2px] bg-primary/60"></div>
        </div>

        {/* B. 文稿区：这里的字体做了深度优化 */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-8">
          {content ? (
            <div className={`
              text-textMain 
              leading-[2.2] 
              /* 🟢 字号自适应：手机16px，大屏18px */
              text-[16px] md:text-[18px] 
              /* 🟢 字重变细：font-light 让文字更有呼吸感 */
              font-light 
              space-y-6 
              whitespace-pre-wrap 
              text-justify
              pb-20
            `}>
              {content}
            </div>
          ) : (
            <div className="text-textSub text-sm font-light leading-loose py-10">
              <p>{lang === 'en' ? '(No content available)' : '（暂无讲稿内容）'}</p>
            </div>
          )}
        </div>
      </div>

      {/* C. 底部 5% 弹性留白 */}
      <div className="h-[5vh] shrink-0 w-full" />
    </div>
  );
};

export default CourseDetail;