import { useParams, useNavigate } from 'react-router-dom';
import StudyRunner from '../../components/StudyRunner';

export default function LearnPage() {
  const { language, game, level } = useParams<{
    language: string;
    game: string;
    level: string;
  }>();
  const navigate = useNavigate();

  if (!language || !game || !level) {
    return (
      <div className="kc-container">
        <div className="alert alert-error">无效的学习路径参数</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    );
  }

  const levelNum = parseInt(level, 10);
  if (isNaN(levelNum)) {
    return (
      <div className="kc-container">
        <div className="alert alert-error">关卡编号无效</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="kc-container" style={{ maxWidth: 1200, paddingTop: 24 }}>
      <StudyRunner language={language} game={game} level={levelNum} />
    </div>
  );
}
