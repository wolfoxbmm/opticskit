import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#F2F3F5]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E9ECEF] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E7F5FF] flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#228BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">联系我们</h1>
          <p className="text-sm text-[#868E96] mb-8 leading-relaxed">
            有任何问题、建议或合作意向，欢迎发送邮件。
          </p>

          <a
            href="mailto:techoptical@163.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#228BE6] text-white text-sm font-semibold hover:bg-[#1c7ed6] transition-colors no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            techoptical@163.com
          </a>

          <p className="text-xs text-[#ADB5BD] mt-6">
            也可关注公众号
            <br />
            <span className="text-[#495057] font-medium">光学科技资讯</span>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-block py-2 px-3 text-sm text-[#868E96] hover:text-[#1A1A2E] transition-colors no-underline min-h-[44px]">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
