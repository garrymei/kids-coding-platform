import React from 'react';

export interface LegalNoticeProps {
  type?: 'registration' | 'authorization' | 'data-access' | 'general';
  className?: string;
}

export function LegalNotice({ type = 'general', className = '' }: LegalNoticeProps) {
  const getNoticeContent = () => {
    switch (type) {
      case 'registration':
        return {
          title: '注册须知',
          content: [
            '我们严格保护您的个人信息，遵循相关法律法规要求。',
            '注册即表示您同意我们的服务条款和隐私政策。',
            '未成年人注册需要监护人同意。',
            '您可以随时联系我们删除您的账户和个人信息。',
          ],
          links: [
            { text: '服务条款', href: '/legal/terms' },
            { text: '隐私政策', href: '/legal/privacy' },
            { text: '儿童隐私保护', href: '/legal/children-privacy' },
          ],
        };

      case 'authorization':
        return {
          title: '授权须知',
          content: [
            '您正在申请访问学生的个人数据。',
            '只有在学生明确同意的情况下，您才能查看其学习数据。',
            '学生可以随时撤销您的访问权限。',
            '我们只分享您明确申请的数据类型，不会超出授权范围。',
            '所有数据访问都有详细的审计记录，确保透明和可追溯。',
          ],
          links: [
            { text: '数据使用说明', href: '/legal/data-usage' },
            { text: '授权管理', href: '/legal/authorization' },
            { text: '隐私保护', href: '/legal/privacy' },
          ],
        };

      case 'data-access':
        return {
          title: '数据访问须知',
          content: [
            '您正在查看学生的个人学习数据。',
            '请确保您已获得相应的访问授权。',
            '请勿将学生数据用于授权范围之外的用途。',
            '如发现数据使用不当，请立即联系我们。',
          ],
          links: [
            { text: '数据使用规范', href: '/legal/data-usage' },
            { text: '举报不当使用', href: '/legal/report' },
          ],
        };

      default:
        return {
          title: '法律声明',
          content: [
            '我们致力于保护用户隐私和数据安全。',
            '请遵守相关法律法规和平台使用规范。',
            '如有疑问，请联系我们的法律团队。',
          ],
          links: [
            { text: '服务条款', href: '/legal/terms' },
            { text: '隐私政策', href: '/legal/privacy' },
            { text: '联系我们', href: '/legal/contact' },
          ],
        };
    }
  };

  const notice = getNoticeContent();

  return (
    <div className={`legal-notice ${className}`}>
      <div className="legal-notice__header">
        <h4 className="legal-notice__title">{notice.title}</h4>
      </div>

      <div className="legal-notice__content">
        <ul className="legal-notice__list">
          {notice.content.map((item, index) => (
            <li key={index} className="legal-notice__item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="legal-notice__links">
        {notice.links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="legal-notice__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.text}
          </a>
        ))}
      </div>

      <div className="legal-notice__footer">
        <p className="legal-notice__disclaimer">
          本平台严格遵循《个人信息保护法》、《儿童个人信息网络保护规定》等相关法律法规。
        </p>
      </div>
    </div>
  );
}

export default LegalNotice;
