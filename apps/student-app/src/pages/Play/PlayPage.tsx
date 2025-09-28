
import { useParams } from 'react-router-dom';

export default function PlayPage() {
  const { levelId } = useParams();

  return (
    <div>
      <h1>游戏挑战 (Play)</h1>
      <p>关卡 ID: {levelId}</p>
    </div>
  );
}
