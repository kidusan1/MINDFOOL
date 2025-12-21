import React, { useState } from 'react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../src/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
  users?: User[];
  authCode: string;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users = [], authCode, lang, setLang }) => {
  const t = TRANSLATIONS[lang].login;
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState('');
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 将姓名转换为邮箱格式（处理中文等非ASCII字符）
  const nameToEmail = (name: string): string => {
    // 使用 Base64 编码处理中文，并替换不安全的字符
    const encoded = btoa(encodeURIComponent(name.trim()))
      .replace(/\+/g, '-')  // Base64 的 + 替换为 -
      .replace(/\//g, '_')  // Base64 的 / 替换为 _
      .replace(/=+$/, '');  // 移除 Base64 padding 的 =
    return `${encoded}@zenapp.com`;
  };

  const handleAction = async () => {
    setError('');
    
    if (!name.trim()) {
      setError(t.namePlaceholder);
      return;
    }
    
    if (password.length < 6) {
        setError(lang === 'zh' ? '密码必须为6位数字' : 'Password must be 6 digits');
        return;
    }

    setLoading(true);
    
    try {
      const email = nameToEmail(name.trim());
      console.log('Converted name to email:', name.trim(), '->', email);
      
      if (isLoginMode) {
        // 使用 Supabase 登录
        console.log('Attempting signIn with email:', email);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(lang === 'zh' ? '姓名或密码错误' : 'Invalid name or password');
          setLoading(false);
          return;
        }

        if (data.user) {
          // 从 user_metadata 获取用户信息
          const metadata = data.user.user_metadata || {};
          const user: User = {
            id: data.user.id,
            name: metadata.name || name.trim(),
            classVersion: metadata.classVersion || '成长班 1.0',
            isAdmin: metadata.isAdmin || name.trim() === '管理员',
          };
          onLogin(user);
        }
      } else {
        // 注册
        if (password !== repeatPassword) {
          setError(lang === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match');
          setLoading(false);
          return;
        }
        
        console.log('Attempting signUp with email:', email);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              classVersion: '成长班 1.0',
              isAdmin: name.trim() === '管理员',
            },
          },
        });

        if (signUpError) {
          setError(lang === 'zh' ? signUpError.message || '注册失败，该姓名可能已被注册' : signUpError.message || 'Registration failed, name may already be registered');
          setLoading(false);
          return;
        }

        if (data.user) {
          const user: User = {
            id: data.user.id,
            name: name.trim(),
            classVersion: '成长班 1.0',
            isAdmin: name.trim() === '管理员',
          };
          onLogin(user);
        }
      }
    } catch (err) {
      setError(lang === 'zh' ? '操作失败，请重试' : 'Operation failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
      setError('');
      if (inputAuthCode !== authCode) {
          setError(lang === 'zh' ? '授权码错误' : 'Invalid auth code');
          return;
      }
      if (newPassword.length < 6) {
          setError(lang === 'zh' ? '新密码必须为6位数字' : 'New password must be 6 digits');
          return;
      }
      
      const foundUser = users.find(u => u.name === name);
      if (foundUser) {
          onLogin({ ...foundUser, password: newPassword });
      } else {
          setError(lang === 'zh' ? '未找到该用户，请直接注册' : 'User not found, please register');
          setTimeout(() => {
             setShowReset(false);
             setIsLoginMode(false);
             setError('');
          }, 1500);
      }
  };

  if (showReset) {
      return (
        <div className="min-h-screen bg-[#F0EEE9] flex flex-col items-center justify-center p-6 relative">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white relative z-10 animate-fade-in-up">
                <h2 className="text-xl font-medium text-primary text-center mb-6">{t.resetTitle}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-textSub mb-2 pl-1">{t.authCode}</label>
                        <input type="text" value={inputAuthCode} onChange={(e) => { setInputAuthCode(e.target.value); setError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textMain outline-none" placeholder="Enter Code" />
                    </div>
                    <div>
                        <label className="block text-xs text-textSub mb-2 pl-1">{t.newPwd}</label>
                        <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textMain outline-none" placeholder="Enter New Password" />
                    </div>
                    
                    {error && <div className="text-red-500 text-xs text-center font-medium">{error}</div>}

                    <button onClick={handleResetPassword} className="w-full py-3 rounded-xl bg-primary text-white font-medium mt-2">{t.confirmReset}</button>
                    <button onClick={() => { setShowReset(false); setError(''); }} className="w-full py-3 rounded-xl bg-gray-200 text-textSub font-medium">{TRANSLATIONS[lang].app.cancel}</button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F0EEE9] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

      <div className="absolute top-6 right-6 z-20">
         <div className="bg-white/50 backdrop-blur-sm rounded-lg p-1 flex">
            <button onClick={() => setLang('zh')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'zh' ? 'bg-white shadow-sm text-primary' : 'text-textSub'}`}>中文</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === 'en' ? 'bg-white shadow-sm text-primary' : 'text-textSub'}`}>EN</button>
         </div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white relative z-10 animate-fade-in-up">
        <div className="flex bg-gray-100/80 p-1 rounded-xl mb-8">
            <button onClick={() => { setIsLoginMode(true); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-textSub hover:text-textMain'}`}>{t.login}</button>
            <button onClick={() => { setIsLoginMode(false); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${!isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-textSub hover:text-textMain'}`}>{t.register}</button>
        </div>

        <div className="space-y-5">
            <div className="animate-fade-in-up" key={isLoginMode ? 'login-name' : 'reg-name'}>
              <label className="block text-xs text-textSub mb-1 pl-1">{t.name}</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder={t.namePlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textMain outline-none focus:border-primary transition-colors" />
            </div>

            <div className="animate-fade-in-up" style={{animationDelay: '0.05s'}} key={isLoginMode ? 'login-pwd' : 'reg-pwd'}>
              <label className="block text-xs text-textSub mb-1 pl-1">{t.pwd}</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder={t.pwdPlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textMain outline-none focus:border-primary transition-colors" />
            </div>

            {!isLoginMode && (
                <>
                    <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                        <label className="block text-xs text-textSub mb-1 pl-1">{t.confirmPwd}</label>
                        <input type="password" value={repeatPassword} onChange={(e) => { setRepeatPassword(e.target.value); setError(''); }} placeholder={t.confirmPwdPlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textMain outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        <label className="block text-xs text-textSub mb-1 pl-1">{t.classType}</label>
                        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-textSub cursor-not-allowed">成长班 1.0</div>
                    </div>
                </>
            )}

            <button onClick={handleAction} disabled={loading} className="w-full py-4 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/20 active:scale-95 transition-transform mt-6 hover:bg-primary/90">{loading ? t.processing : (isLoginMode ? t.actionLogin : t.actionRegister)}</button>
            <div className="flex flex-col items-center gap-1 pt-2 min-h-[40px]">
                {error && <span className="text-xs text-red-500 font-medium animate-pulse text-center">{error}</span>}
                {isLoginMode && <button onClick={() => { setShowReset(true); setError(''); }} className="text-xs text-red-400 underline opacity-80 hover:opacity-100 transition-opacity">{t.forget}</button>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;