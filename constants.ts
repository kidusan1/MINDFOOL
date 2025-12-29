
import { CourseWeek, TimerType, CourseStatus } from './types';

export const COURSE_SCHEDULE: CourseWeek[] = [
  { id: 1, title: '第一周: 何谓佛教', status: CourseStatus.ENDED },
  { id: 2, title: '第二周: 学佛是否需要舍离一切的欲望?', status: CourseStatus.ENDED },
  { id: 3, title: '第三周: 如何学佛', status: CourseStatus.ENDED },
  { id: 4, title: '第四周: 什么是佛教的真理?', status: CourseStatus.ENDED },
  { id: 5, title: '第五周: 解脱就是看破与放下吗', status: CourseStatus.ENDED },
  { id: 6, title: '第六周: 什么是寂灭为乐', status: CourseStatus.ENDED },
  { id: 7, title: '第七周: 不执着就是应无所住而生其心?', status: CourseStatus.ENDED },
  { id: 8, title: '第八周: 佛教的因果观', status: CourseStatus.IN_PROGRESS },
];

export const TIMER_TYPES = [
  { type: TimerType.NIANFO, label: '念佛念经', color: '#6D8D9D' },
  { type: TimerType.BAIFO, label: '忆佛拜佛', color: '#AEC6CF' },
  { type: TimerType.ZENGHUI, label: '一念相续', color: '#B5D9AD' }, 
];

// Order: Thu, Sat, Tue, Wed
export const WEEK_DAYS_OPTIONS = [
  { id: 'thu', label: '周四' },
  { id: 'sat', label: '周六' },
  { id: 'tue', label: '周二' },
  { id: 'wed', label: '周三' },
];

export const SPLASH_QUOTES = [
  "不记得是谁说 当我们能感理平衡 可以承担自己 有自己独立的思考与选择 才会在遇见生命事实时 有份直了的承担",
  "曾是需要依附的孱弱孩童 终长成能够担当的独立之人 曾陷于烦恼迷雾 终抵达澄明心境 唯经此蜕变 方有能力勘破虚妄 回归真实",
  "不记得是谁说 相信所有人都会找到适合自己的路 我们只需要活出自己小小的光芒 需要光的人 会循着光而来",
  "不记得是谁说 从来都是 靠看见生命的真相 靠智慧的洞见而得解脱 而不是靠大师的认可 不是靠团体的温暖而得解脱",
  "不记得是谁说 自我本就是不存在的 并不是我们努力去除的",
  "不记得是谁说 一个人内在的成长 内在生命品质的呈现 自然就会发光",
  "不记得是谁说 成长的方向 是发现生命无我的事实 而不是在有我的前提下成为更好的自我",
  "不记得是谁说 我们一直在渴望 百分之百被接住 但其实只需要我们 对生命有百分之百的信任 便是安然",
  "不记得是谁说 生命成长 有两步非常关键 甘愿放下误会的幻象和执念 慢慢认出并转向真实的寂然"
];

export const SPLASH_QUOTES_EN = [
  "When we balance sense and reason, bearing our own weight with independent thought, we can face life's truths with direct resolve.",
  "From a dependent child to an independent soul; from the fog of vexation to clarity of mind. Only through this transformation can we pierce illusions and return to reality.",
  "Trust that everyone finds their own path. We only need to live out our small light; those who need it will follow the glow.",
  "Liberation comes from seeing the truth of life and insightful wisdom, not from a master's approval or the warmth of a group.",
  "The 'self' does not inherently exist; it is not something we struggle to remove, but something we realize was never there.",
  "When one grows inwardly, the quality of that inner life naturally shines forth.",
  "The direction of growth is to discover the fact of 'non-self' in life, not to become a 'better self' upon the premise of a self.",
  "We long to be fully caught and held, but all we need is 100% trust in life itself to find peace.",
  "Two key steps in life's growth: willingly laying down misunderstood illusions and attachments, and slowly recognizing and turning toward the true silence."
];

// --- I18N DICTIONARY ---

export const TRANSLATIONS = {
  zh: {
    app: {
      title: '慢心障道',
      welcome: '欢迎',
      logout: '退出登录',
      back: '返回',
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      submit: '提交',
      class: '班'
    },
    nav: {
      home: '主页',
      tools: '每日功课',
      daily: '正知正见',
      record: '记录成长',
      admin: '后台管理'
    },
    home: {
      durationLabel: '今日功课时长',
      minutes: '分钟',
      start: '开始',
      nianfo: '念佛念经',
      baifo: '忆佛拜佛',
      zenghui: '一念相续',
      breath: '呼吸跟随'
    },
    tools: {
      breathing: '呼吸跟随',
      stats: '数据统计',
      timer: {
        clickStart: '点击开始',
        countdown: '倒计时'
      }
    },
    stats: {
      encouragement_prefix: '今天你已完成',
      encouragement_suffix: '，不要松懈，继续加油！',
      encouragement_empty: '今天还没有开始练习，不要懈怠，快些行动起来吧！',
      ranking: '用功时长已经超过 %s% 的同学啦，叫上你的伙伴一起精进呦!',
      ranking_empty: '今天还没有开始练习，不要懈怠，快些行动起来吧！',
      trend: '过去七天趋势',
      today: '今天',
      share: '分享',
      showDetails: '显示功课详情',
      hideDetails: '隐藏功课详情'
    },
    daily: {
      weekStatus: '本周状态',
      leave: '已请假',
      normal: '正常上课',
      checkInHint: '请按时完成签到',
      wantLeave: '我想请假',
      revokeLeave: '销假',
      revokeLeaveConfirmTitle: '确认销假',
      revokeLeaveConfirmContent: '每个账号本周只有一次销假机会，确认要取消请假并恢复正常上课状态吗？',
      revokeLeaveSuccess: '已成功销假',
      checkIn: '上课签到',
      offlineCheckIn: '线下签到',
      onlineCheckIn: '线上打卡',
      locating: '定位...',
      successOffline: '线下签到成功',
      successOnline: '线上打卡成功',
      leaveReason: '请假原因',
      courseList: '课程列表',
      courseHint: '- 仅根据学员归属 展示对应课程内容 -',
      leaveInputPlaceholder: '请输入...',
      alreadyLeft: '本周已请假，无需签到'
    },
    record: {
      newRecord: '新记录',
      editRecord: '编辑记录',
      types: {
        good: '每日一善',
        balance: '感理平衡',
        sloth: '懈怠/掉举'
      },
      placeholder: '记录你当下的感悟、想法、烦恼……',
      empty: '暂无记录，点击右下角添加',
      swipeHint: '- 右滑置顶 左滑删除 -',
      pin: '置顶',
      unpin: '取消'
    },
    admin: {
      title: '后台管理中心',
      tabs: {
        signups: '请假/签到状态',
        courses: '课程管理',
        users: '用户权限',
        settings: '配置'
      },
      export: '导出 Excel (CSV)',
      noData: '暂无数据记录',
      resetPwd: '重置密码',
      courseEdit: '课程内容编辑',
      version: '选择版本',
      week: '选择周次',
      progress: '课程进度',
      content: '讲稿内容',
      contentPlaceholder: '请输入该课程的详细讲稿内容...',
      courseTitle: '课程标题',
      courseTitlePlaceholder: '例如: 第一周: 什么是佛法',
      saveContent: '保存当前内容',
      addWeek: '+ 新增一周',
      delWeek: '删除当前周',
      config: '系统配置',
      locationConfig: '线下签到位置配置',
      enableLoc: '启用位置限制',
      locName: '位置名称',
      radius: '允许半径 (米)',
      getLocation: '获取当前位置填入',
      saveLoc: '保存位置配置',
      authCode: '密码重置授权码',
      splash: 'Splash 开屏金句配置 (每句一行)',
      homeQuotes: '首页/分享金句配置 (每句一行)',
      saveSplash: '保存金句'
    },
    login: {
      login: '登录',
      register: '注册',
      name: '您的姓名',
      namePlaceholder: '请输入姓名',
      pwd: '密码 (6位数字)',
      pwdPlaceholder: '请输入密码',
      confirmPwd: '确认密码',
      confirmPwdPlaceholder: '请再次输入密码',
      classType: '班型选择',
      actionLogin: '立即登录',
      actionRegister: '立即注册',
      processing: '处理中...',
      forget: '忘记密码？点击使用授权码重置',
      resetTitle: '重置密码',
      authCode: '管理员授权码',
      newPwd: '新密码 (6位数字)',
      confirmReset: 'Confirm Reset'
    }
  }
  ,
  en: {
    app: {
      title: 'MINDFOOL',
      welcome: 'Welcome',
      logout: 'Logout',
      back: 'Back',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      class: 'Class'
    },
    nav: {
      home: 'Home',
      tools: 'Practice',
      daily: 'Right View',
      record: 'Journal',
      admin: 'Admin'
    },
    home: {
      durationLabel: 'Practice Duration',
      minutes: 'Min',
      start: 'Start',
      nianfo: 'Chanting',
      baifo: 'Bowing',
      zenghui: 'Mindfulness',
      breath: 'Breathing'
    },
    tools: {
      breathing: 'Breathing',
      stats: 'Statistics',
      timer: {
        clickStart: 'Click Start',
        countdown: 'Timer'
      }
    },
    stats: {
      encouragement_prefix: 'Completed: ',
      encouragement_suffix: '. Keep it up!',
      encouragement_empty: 'No practice yet today. Time to begin!',
      ranking: 'You have surpassed %s% of students in practice time. Keep improving together!',
      trend: '7-Day Trend',
      today: 'Today',
      share: 'SHARE',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details'
    },
    daily: {
      weekStatus: 'Week Status',
      leave: 'On Leave',
      normal: 'Active',
      checkInHint: 'Please check-in on time',
      wantLeave: 'Request Leave',
      revokeLeave: 'Cancel Leave',
      revokeLeaveConfirmTitle: 'Confirm Cancel Leave',
      revokeLeaveConfirmContent: 'You only have one chance to revoke leave this week. Are you sure you want to return to active status?',
      revokeLeaveSuccess: 'Leave Cancelled',
      checkIn: 'Check-in',
      offlineCheckIn: 'Offline Check-in',
      onlineCheckIn: 'Online Check-in',
      locating: 'Locating...',
      successOffline: 'Checked in (Offline)',
      successOnline: 'Checked in (Online)',
      leaveReason: 'Reason',
      courseList: 'Course List',
      courseHint: '- Courses displayed based on your class version -',
      leaveInputPlaceholder: 'Enter reason...',
      alreadyLeft: 'On leave this week'
    },
    record: {
      newRecord: 'New Entry',
      editRecord: 'Edit Entry',
      types: {
        good: 'Good Deed',
        balance: 'Balance',
        sloth: 'Sloth/Distraction'
      },
      placeholder: 'Record your current realizations, thoughts, worries...',
      empty: 'No records yet. Tap + to add.',
      swipeHint: '- Swipe Right to Pin, Swipe Left to Delete -',
      pin: 'Pin',
      unpin: 'Unpin'
    },
    admin: {
      title: 'Admin Center',
      tabs: {
        signups: 'Status',
        courses: 'Courses',
        users: 'Users',
        settings: 'Settings'
      },
      export: 'Export CSV',
      noData: 'No Data Available',
      resetPwd: 'Reset Pwd',
      courseEdit: 'Course Editor',
      version: 'Version',
      week: 'Week',
      progress: 'Status',
      content: 'Content',
      contentPlaceholder: 'Enter detailed course content...',
      courseTitle: 'Course Title',
      courseTitlePlaceholder: 'e.g. Week 1: What is Dharma',
      saveContent: 'Save Content',
      addWeek: '+ Add Week',
      delWeek: 'Delete Week',
      config: 'Configuration',
      locationConfig: 'Offline Check-in Location',
      enableLoc: 'Enable Location Limit',
      locName: 'Location Name',
      radius: 'Radius (Meters)',
      getLocation: 'Get Current Location',
      saveLoc: 'Save Location',
      authCode: 'Reset Auth Code',
      splash: 'Splash Quotes (One per line)',
      homeQuotes: 'Home/Share Quotes (One per line)',
      saveSplash: 'Save Quotes'
    },
    login: {
      login: 'Login',
      register: 'Register',
      name: 'Name',
      namePlaceholder: 'Enter Name',
      pwd: 'Password (6 digits)',
      pwdPlaceholder: 'Enter Password',
      confirmPwd: 'Confirm Password',
      confirmPwdPlaceholder: 'Confirm Password',
      classType: 'Class Type',
      actionLogin: 'Login Now',
      actionRegister: 'Register Now',
      processing: 'Processing...',
      forget: 'Forgot Password? Use Auth Code',
      resetTitle: 'Reset Password',
      authCode: 'Admin Auth Code',
      newPwd: 'New Password (6 digits)',
      confirmReset: 'Confirm Reset'
    }
  }
};

// --- SOUND EFFECTS DISABLED ---

export const playSound = (type: 'light' | 'medium' | 'confirm') => {
  // Sound disabled per user request
};
