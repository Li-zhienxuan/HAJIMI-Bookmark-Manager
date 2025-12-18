import React from 'react';
import { X, ExternalLink, Info, ShieldCheck, Zap } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden transform transition-all scale-100">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Zap className="text-blue-500 mr-2" size={20} />
              欢迎使用 HAJIMI 书签管理器
            </h2>
            <p className="text-xs text-slate-500 mt-1">本地优先 · Git 驱动 · 数据自主</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* 一、 存储逻辑说明 */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
              一、 存储逻辑说明
            </h3>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-sm leading-relaxed text-slate-300">
              HAJIMI 不建立中央数据库，而是利用 <strong>CNB (腾讯云原生)</strong> 或 <strong>GitHub</strong> 的 API，将您的书签以 <code>bookmarks.json</code> 文件的形式保存在您个人的仓库中。这意味着您拥有数据的绝对所有权。
            </div>
          </section>

          {/* 二、 CNB 极速配置指南 (推荐) */}
          <section>
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
              二、 CNB 极速配置指南 (国内推荐)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="bg-slate-800 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">注册并登录</p>
                  <p className="text-xs text-slate-500 mt-1">访问 <a href="https://cnb.cool" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center">cnb.cool <ExternalLink size={10} className="ml-0.5"/></a>，推荐使用微信一键登录。</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-slate-800 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">创建专属仓库</p>
                  <p className="text-xs text-slate-500 mt-1">新建一个 Git 仓库（如 <code>my-nav</code>），建议将其权限设置为“私有”。</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-slate-800 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">生成访问令牌 (Token)</p>
                  <p className="text-xs text-slate-500 mt-1">在 [个人设置] → [访问令牌] 中创建一个新 Token，勾选 <code>repo</code> 读写权限。</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-slate-800 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">应用同步设置</p>
                  <p className="text-xs text-slate-500 mt-1">点击侧边栏“同步与设置”，填入您的 CNB 用户名、仓库名和 Token，点击“同步”。</p>
                </div>
              </div>
            </div>
          </section>

          {/* 三、 数据安全声明 */}
          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
              三、 数据安全声明
            </h3>
            <div className="flex items-center p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl">
               <ShieldCheck className="text-emerald-500 mr-4 flex-shrink-0" size={24} />
               <p className="text-xs text-emerald-200/70 leading-relaxed">
                 您的访问令牌 (Token) 仅保存在当前浏览器的 <code>LocalStorage</code> 中。应用在同步时会直接请求云端 API，不经过任何中转服务器，确保您的私密数据绝不外泄。
               </p>
            </div>
          </section>

          {/* 四、 其他功能提示 */}
          <section>
            <h3 className="text-lg font-bold text-slate-400 mb-4">
              四、 其他功能提示
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-500 space-y-2 ml-1">
              <li>支持直接拖入 HTML 文件进行书签批量导入。</li>
              <li>点击书签卡片可直接在应用内开启沉浸式预览。</li>
              <li>支持私有仓库与公共仓库两种工作模式切换。</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            我已知晓，进入应用
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;